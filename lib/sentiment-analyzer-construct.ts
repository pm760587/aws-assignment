import { Construct } from '@aws-cdk/core';
import { Table, AttributeType, BillingMode } from '@aws-cdk/aws-dynamodb';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { Runtime } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { RetentionDays } from '@aws-cdk/aws-logs';

export interface ApiAuthorizerConstructProps {
  tableName: string,
}

export class SentimentAnalyzerConstruct extends Construct {

  public readonly handler: NodejsFunction;

  constructor(scope: Construct, id: string, props: ApiAuthorizerConstructProps) {
    super(scope, id);

    // 👇 create the dynamodb table that stores the sentimental analysis
    const comprehendTable = new Table(this, 'ComprehendTable', {
      tableName: props.tableName,
      billingMode: BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      partitionKey: {
        name: 'pKey',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'sKey',
        type: AttributeType.STRING,
      },
    });

    // 👇 create the lambda that analyses the sentiment of the feedback message
    const comprehendLambda = new NodejsFunction(this, 'ComprehendLambda', {
      entry: './lambda/sentimental-analysis.js',
      runtime: Runtime.NODEJS_14_X,
      logRetention: RetentionDays.ONE_WEEK,
      environment: {
        FEEDBACK_TABLE: comprehendTable.tableName
      },
      bundling: {
        nodeModules: ['aws-sdk', 'ulid'],
        externalModules: [],
      },
    });

    // 👇 assign our lambda to the handler parameter so it can be invoke outside the constructor
    this.handler = comprehendLambda;

    // 👇 create the policy that calls aws-comprehend
    const comprehendLambdaPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['comprehend:DetectSentiment'],
      resources: ['*'],
    });

    // 👇 attach comprehend policy to the lambda that uses it
    comprehendLambda.addToRolePolicy(comprehendLambdaPolicy);
    
    // 👇 grant table read write access to lambda
    comprehendTable.grantReadWriteData(comprehendLambda);
  }
}