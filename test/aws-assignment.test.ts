import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');

import { AwsAssignmentStack } from '../lib/aws-assignment-stack';

test('AwsAssignmentStack resources created', () => {
  const app = new cdk.App();
  
  //WHEN
  const stack = new AwsAssignmentStack(app, 'AwsAssignmentStack', {
    stackName: 'AwsAssignmentStack'
  });
  //THEN
  expectCDK(stack).to(haveResource("AWS::ApiGatewayV2::Api"));
  expectCDK(stack).to(haveResource("AWS::ApiGatewayV2::Stage"));
  expectCDK(stack).to(haveResource("AWS::ApiGatewayV2::Integration"));
  expectCDK(stack).to(haveResource("AWS::ApiGatewayV2::Route"));
  expectCDK(stack).to(haveResource("AWS::ApiGatewayV2::Authorizer"));
  expectCDK(stack).to(haveResource("AWS::Lambda::Permission"));
});