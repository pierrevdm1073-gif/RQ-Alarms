const webpush = require('web-push');
const fs = require('fs');
if (!fs.existsSync('vapid.json')) {
  const vapidKeys = webpush.generateVAPIDKeys();
  fs.writeFileSync('vapid.json', JSON.stringify(vapidKeys, null, 2));
  console.log('Generated new VAPID keys');
} else {
  console.log('VAPID keys already exist');
}
