/* Things that change often live here, so nobody has to edit the page HTML.
   Save the file, upload it, and the pages pick the changes up. */
window.CHURCH_CONFIG = {
  /* YouTube channel ID: a code that starts with "UC" (24 characters).
     Find it in YouTube Studio > Settings > Channel > Advanced settings.
     When it is filled in, the Media page shows the live stream and the latest uploads.
     Leave it empty to show plain links to the channel instead. */
  youtubeChannelId: "",

  /* Special events for the Events page. Remove an event after it has passed
     (past events are also hidden automatically). Example:

     { date: "2026-12-24", time: "18:00", title: "Christmas Eve service",
       text: "Worship, songs and a short message.", place: "Bienleinstorstraße 1, Karlsruhe" }
  */
  events: []
};
