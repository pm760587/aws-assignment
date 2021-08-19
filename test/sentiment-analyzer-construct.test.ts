import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');

import { SentimentAnalyzerConstruct } from '../lib/sentiment-analyzer-construct';

test('SentimentalAnalyzerConstruct resources created', () => {
  const stack = new cdk.Stack();

  //WHEN
  new SentimentAnalyzerConstruct(stack, 'TestSentimentalAnalyzer', {
    tableName: 'TestTable',
  });
  //THEN
  expectCDK(stack).to(haveResource("AWS::DynamoDB::Table"));
  expectCDK(stack).to(haveResource("AWS::IAM::Policy"));
  expectCDK(stack).to(haveResource("AWS::IAM::Role"));
  expectCDK(stack).to(haveResource("AWS::Lambda::Function"));
  expectCDK(stack).to(haveResource("Custom::LogRetention"));
});