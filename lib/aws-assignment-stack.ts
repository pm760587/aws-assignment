import * as cdk from '@aws-cdk/core';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Runtime } from '@aws-cdk/aws-lambda';
import * as cognito from '@aws-cdk/aws-cognito';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2';
import { BillingMode } from '@aws-cdk/aws-dynamodb';
import { LambdaProxyIntegration } from '@aws-cdk/aws-apigatewayv2-integrations';
import { SentimentAnalyzerConstruct } from './sentiment-analyzer-construct';
import { ApiAuthorizerConstruct } from './api-authorizer-construct';

export class AwsAssignmentStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sentimentalAnalyzer = new SentimentAnalyzerConstruct(this, 'SentimentalAnalyzer', {
      tableName: 'sentimental-analysis-table'
    });
    const apiAuthorizer = new ApiAuthorizerConstruct(this, 'APIAuthorizer', {
      downstream: sentimentalAnalyzer.handler
    });

    // 👇 create the API
    const comprehendHttpApi = new apiGateway.HttpApi(this, 'SentimentalAnalysisAPI', {
      apiName: `sentimental-analysis-http-api`,
    });

    // 👇 set the Authorizer on the Route
    comprehendHttpApi.addRoutes({
      integration: new LambdaProxyIntegration({
        handler: apiAuthorizer.handler,
      }),
      path: '/comprehend',
      authorizer: apiAuthorizer.authorizer,
    });

    // 👇 output api endpoint
    new cdk.CfnOutput(this, 'region', {value: cdk.Stack.of(this).region});
    new cdk.CfnOutput(this, 'SentimentalAnalysisAPI-URL', {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      value: comprehendHttpApi.url!,
    });
  }
}
