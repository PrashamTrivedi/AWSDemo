exports.handler = async function (event, context) {
    console.log('Hi');
    console.log(`Event is ${JSON.stringify(event)}`);
    console.log(`Context is ${JSON.stringify(context)}`);
    console.log(`Query is ${JSON.stringify(event.queryStringParameters)}`);
    let response = JSON.stringify(event, null, 0);
    console.log(response);
    return { statusCode: 200, body: JSON.stringify({ name: 'AWS' }) };
}