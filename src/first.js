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
        if (event.queryStringParameters.number % 2 == 0) {
            
            return { statusCode: 200, body: JSON.stringify({ name: 'AWS',number: event.queryStringParameters.number, message:'This is Even!'}) };
        } else {
            
            return { statusCode: 200, body: JSON.stringify({ name: 'AWS',number: event.queryStringParameters.number, message:'This is Odd!'}) };
        }
    } else {
        return { statusCode:200,body:JSON.stringify({name: 'AWS', message:'Provide a number to check whether it\'s even or odd'})}
    }
    
}