import AWS from 'aws-sdk';
const lambda = new AWS.Lambda();

exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  // 👇 calls downstream function and capture response
  const downstreamResponse = await lambda.invoke({
    FunctionName: process.env.DOWNSTREAM_FUNCTION_NAME,
    Payload: JSON.stringify(event)
  }).promise();

  console.log('downstream response:', JSON.stringify(downstreamResponse, undefined, 2));

  // 👇 returns response back to upstream caller
  return JSON.parse(downstreamResponse.Payload);
};