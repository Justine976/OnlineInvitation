# OnlineInvitation

A fully static RSVP invitation builder that runs entirely in the browser.  
Built with vanilla HTML, CSS, and JavaScript — no backend required.
```vibe coded hehehe```
## Live Demo

Once deployed to GitHub Pages, visit:

```
https://justine976.github.io/OnlineInvitation/
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to your repository **Settings** → **Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Set **Branch** to `main` and folder to `/ (root)`.
5. Click **Save**.

Your site will be live at `https://<username>.github.io/OnlineInvitation/` within a few minutes.

## Project Structure

```
OnlineInvitation/
├── index.html              # Builder — create an invitation
├── pages/
│   ├── homePage.html       # Share — copy the invitation link
│   ├── invitationPage.html # View — recipient views & RSVPs
│   └── thankPage.html      # Confirm — inviter notified via EmailJS
├── assets/
│   ├── css/
│   │   └── styles.css      # Global styles
│   └── js/
│       ├── app.js          # Application logic (all pages)
│       └── config/
│           └── emailjs-config.js  # EmailJS credentials
└── README.md
```

## How It Works

- **Builder** (`index.html`): Create an invitation. Data is encoded and passed through the URL.
- **Share** (`pages/homePage.html`): Copy the invitation link to share.
- **Invitation** (`pages/invitationPage.html`): Recipient views the invitation and sends an RSVP.
- **Thank You** (`pages/thankPage.html`): The inviter is notified via EmailJS.

Invitation data is encoded in the URL (hash fragment), so no server-side storage is needed.  
RSVPs are stored locally in the respondent's browser and emailed to the inviter via EmailJS.

## Running Locally (no server needed)

Since this is a fully static site, you can open any HTML file directly in your browser:

```text
Open index.html in your browser
```

The builder, share, and invitation pages will work without a server.  
The thank-you page requires EmailJS configuration for email notifications (see below).

## Email Configuration

Email notifications are sent via [EmailJS](https://www.emailjs.com/).

1. Sign up at EmailJS and create a service + email template.
2. Open `assets/js/config/emailjs-config.js` and update the values:

   ```js
   const EMAILJS_CONFIG = {
     publicKey: 'your-public-key',
     serviceID: 'your-service-id',
     templateID: 'your-template-id',
   };
