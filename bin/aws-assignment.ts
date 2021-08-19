#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AwsAssignmentStack } from '../lib/aws-assignment-stack';

const app = new cdk.App();
new AwsAssignmentStack(app, 'AwsAssignmentStack', {
  stackName: 'AwsAssignmentStack'
});
