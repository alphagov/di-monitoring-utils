const axios = require('axios');
const { getParameter } = require("./aws");

const formatMessage = (snsMessage, colorCode, snsMessageFooter) => {
    if(JSON.stringify(snsMessage).includes("ElastiCache")) {
        return {
            "attachments": [{
                "fallback": Object.keys(snsMessage)[0] + "for cluster: " + Object.values(snsMessage)[0],
                "color": "#ff9966",
                "title": Object.values(snsMessage)[0] + "-notification",
                "text": Object.keys(snsMessage)[0] + " for cluster: " + Object.values(snsMessage)[0],
                "fields": [{
                    "title": "Status",
                    "value": "INFO",
                    "short": false
                }],
                "footer": snsMessageFooter
            }]
        };
    } else {
        return {
            "attachments": [{
                "fallback": snsMessage.AlarmDescription,
                "color": colorCode,
                "title": snsMessage.AlarmName,
                "text": snsMessage.AlarmDescription,
                "fields": [{
                    "title": "Status",
                    "value": snsMessage.NewStateValue,
                    "short": false
                }],
                "footer": snsMessageFooter
            }]
        };
    }
}

const handler = async function(event, context) { // eslint-disable-line no-unused-vars
    console.log("Alert lambda triggered");
    const slackHookUrl = process.env.SLACK_WEBHOOK_URL || await getParameter(process.env.DEPLOY_ENVIRONMENT+"-slack-hook-url");
    let colorCode = process.env.ERROR_COLOR || "#C70039";
    let snsMessageFooter = process.env.MESSAGE_FOOTER || "GOV.UK Sign In alert";

    let snsMessage = JSON.parse(event.Records[0].Sns.Message);
    if (snsMessage.NewStateValue === "OK") {
        colorCode = process.env.OK_COLOR || "#36a64f";
    }

    var config = {
        method: 'post',
        url: slackHookUrl,
        headers: {
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(formatMessage(snsMessage, colorCode, snsMessageFooter))
    };
    console.log("Sending alert to slack");
    try {
        const response = await axios(config);
        console.log(JSON.stringify(response.data));
    } catch (error) {
        console.log(error);
    }
};

module.exports = { handler }