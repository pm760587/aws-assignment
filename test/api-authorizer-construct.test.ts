import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import * as lambda from '@aws-cdk/aws-lambda';

import { ApiAuthorizerConstruct } from '../lib/api-authorizer-construct';

test('ApiAuthorizerConstruct resources created', () => {
  const stack = new cdk.Stack();
  const testLambda = new lambda.Function(stack, 'TestLambda', {
    runtime: lambda.Runtime.NODEJS_14_X,
    code: lambda.Code.fromAsset('lambda'),
    handler: 'test.handler'    
  })

  //WHEN
  new ApiAuthorizerConstruct(stack, 'TestSentimentalAnalyzer', {
    downstream:  testLambda,
  });
  //THEN
  expectCDK(stack).to(haveResource("AWS::Cognito::UserPool"));
  expectCDK(stack).to(haveResource("AWS::Cognito::UserPoolClient"));
  expectCDK(stack).to(haveResource("AWS::IAM::Role"));
  expectCDK(stack).to(haveResource("AWS::IAM::Policy"));
  expectCDK(stack).to(haveResource("AWS::Lambda::Function"));
});