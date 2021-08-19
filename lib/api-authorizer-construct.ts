import { Construct, RemovalPolicy, CfnOutput} from '@aws-cdk/core';
import { HttpUserPoolAuthorizer } from '@aws-cdk/aws-apigatewayv2-authorizers';
import { UserPool, AccountRecovery, UserPoolClient, UserPoolClientIdentityProvider } from '@aws-cdk/aws-cognito';
import { Runtime, IFunction, Function } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';

export interface ApiAuthorizerConstructProps {
  /** the function that analyse the sentiment of a feedback message **/
  downstream: IFunction;
}

export class ApiAuthorizerConstruct extends Construct {

  public readonly handler: NodejsFunction;
  public readonly authorizer: HttpUserPoolAuthorizer;

  constructor(scope: Construct, id: string, props: ApiAuthorizerConstructProps) {
    super(scope, id);

    // 👇 create the user pool
    const userPool = new UserPool(this, 'SentimentalAnalysisAPIUserPool', {
      userPoolName: `sentimental-analysis-api-userpool`,
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 6,
        requireLowercase: false,
        requireDigits: false,
        requireUppercase: false,
        requireSymbols: false,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
    });

    // 👇 create the user pool client
    const userPoolClient = new UserPoolClient(this, 'userpool-client', {
      userPool,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        custom: true,
        userSrp: true,
      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
      ],
    });

    // 👇 create the lambda that sits behind the authorizer
    const authorizerLambda = new NodejsFunction(this, 'comprehend-lambda', {
      runtime: Runtime.NODEJS_14_X,
      entry: `./lambda/authorizer.js`,
      bundling: {
        nodeModules: ['aws-sdk', 'ulid'],
        externalModules: [],
      },
      environment: {
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
      }
    });

    // 👇 grant permissions to the authorizer lambda to invoke the downstream lambda
    props.downstream.grantInvoke(authorizerLambda);

    // 👇 assign authorizer lambda to the handler so it can be used by api-gateway
    this.handler = authorizerLambda;

    // 👇 create the Authorizer
    const authorizer = new HttpUserPoolAuthorizer({
      userPool,
      userPoolClient,
      identitySource: ['$request.header.Authorization'],
    });
    
    // 👇 assign the authorizer to the variable so it can be used by api-gateway
    this.authorizer = authorizer;

    // 👇 outputs values to create new cognito users

    new CfnOutput(this, 'userPoolId', {value: userPool.userPoolId});
    new CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });
  }
}