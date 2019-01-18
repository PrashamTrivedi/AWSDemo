var AWSXray = require('aws-xray-sdk');

exports.handler = async function (event, context) {
    console.log('Hi');
    console.log(`Event is ${JSON.stringify(event)}`);
    console.log(`Context is ${JSON.stringify(context)}`);
    if (event.queryStringParameters) {
        AWSXray.captureFunc('Query', function (subsegment) {
            console.log(`Query is ${JSON.stringify(event.queryStringParameters)}`);
            subsegment.addAnnotation('Query', event.queryStringParameters.number);
            subsegment.addMetadata('Qry', event.queryStringParameters, 'Custom');
            subsegment.addMetadata('Qry', event.queryStringParameters);
        });
    }
    let response = JSON.stringify(event, null, 0);
    console.log(response);
    return { statusCode: 200, body: JSON.stringify({ name: 'AWS' }) };
}