import AWS from 'aws-sdk'
import { ulid } from 'ulid'
import moment from 'moment';
const comprehend = new AWS.Comprehend({ apiVersion: '2017-11-27'});
const documentClient = new AWS.DynamoDB.DocumentClient();

const TableName = process.env.FEEDBACK_TABLE;
const positiveMessage = `We are glad you liked it!`
const negativeMessage = `We are sorry to hear that, please let us know how can we help.`

exports.handler = async function(event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const { body, requestContext } = event;
  const data = JSON.parse(body);
  const httpMethod = requestContext.http.method;

  // POST
  // 👇 posts a new feedback message, analyse  and adds it to dynamodb
  if (httpMethod === 'POST') {
    if (data.feedback) {
      const feedbackMessage = data.feedback;
      if(feedbackMessage.length < 1000) {
        const { Sentiment, SentimentScore } = await comprehend.detectSentiment({
          LanguageCode: 'en',
          Text: feedbackMessage
        }).promise();
        const messageID = ulid();

        try {
          await documentClient.put({
            TableName,
            Item: {
              pKey: messageID,
              sKey: feedbackMessage,
              Feedback: feedbackMessage,
              Sentiment: Sentiment.toLowerCase(),
              SentimentScore: SentimentScore,
              CreatedOn: moment().format(),
            }
          }).promise();

          return {
            statusCode: 200,
            headers: { "Content-Type": 'application/json' },
            body: JSON.stringify({
              response: Sentiment === 'POSITIVE' ? positiveMessage : negativeMessage,
              messageID
            })
          };
        } catch (error) {

          return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({error})
          }
        }
      } else {

        return {
          statusCode: 400,
          headers: { "Content-Type": 'application/json' },
          body: JSON.stringify({
            error: `Expected parameter feedback to be 1000 characteres max`
          })
        }
      }
    } else {

      return {
        statusCode: 400,
        headers: { "Content-Type": 'application/json' },
        body: JSON.stringify({
          error: `Missing parameter feedback in request body`
        })
      }
    }
  }
  
  // GET
  // 👇 get a specific comment given its messageID
  if (httpMethod === 'GET') {
    try {
      const { Items } = await documentClient.scan({
        TableName,
      }).promise();
      
      return {
        statusCode: 200,
        headers: { "Content-Type": 'application/json' },
        body: JSON.stringify({Items})
      }
    } catch (error) {

      return {
        statusCode: 500,
        headers: { "Content-Type": 'application/json' },
        body: JSON.stringify({error})
      }
    }
  }
};
