importScripts(
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js",
);

const configJson = atob(
  "ewogICJwcm9qZWN0SWQiOiAiYW5ndWxhci1sZWRnZXIiLAogICJhcHBJZCI6ICIxOjYwMDg5NzA0MTYwNjp3ZWI6NWRiMWViYTNiNjk2ZmM4YzE5MTNjNyIsCiAgInN0b3JhZ2VCdWNrZXQiOiAiYW5ndWxhci1sZWRnZXIuYXBwc3BvdC5jb20iLAogICJhcGlLZXkiOiAiQUl6YVN5QS0zZnNNS3p4VVgzU1gtQTRzcmhYTkRDbWpKZGFxZ053IiwKICAiYXV0aERvbWFpbiI6ICJhbmd1bGFyLWxlZGdlci5maXJlYmFzZWFwcC5jb20iLAogICJtZXNzYWdpbmdTZW5kZXJJZCI6ICI2MDA4OTcwNDE2MDYiCn0K",
);
firebase.initializeApp(JSON.parse(configJson));

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] 收到背景通知 ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
