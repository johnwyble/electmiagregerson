# Yard Sign Map — setup

`yard-signs.html` is a self-contained page. Open it in any browser and it works right away in **Local mode** (each volunteer's checkmarks are saved only on their own device).

To get the **live, shared** behavior you asked for — where one volunteer checking a box updates for everyone in real time — connect a free Firebase project once. Takes about 5 minutes.

## Turn on live shared mode

1. Go to https://console.firebase.google.com and click **Add project** (any name, e.g. "mia-signs"). You can skip Google Analytics.
2. In the left menu open **Build → Firestore Database → Create database**. Choose **Start in production mode**, pick a region near Seattle (`us-west1`), and finish.
3. Go to the **Rules** tab and paste this, then **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /signs/{doc} {
         allow read, write: if true;
       }
     }
   }
   ```
   (This lets any volunteer read and check off spots. It only exposes which corners are done — no personal data.)
4. Click the gear icon → **Project settings**. Under **Your apps**, click the web icon `</>`, register the app, and copy the `firebaseConfig` values it shows you.
5. Open `yard-signs.html`, find the block near the top that says `PASTE YOUR FIREBASE CONFIG HERE`, and replace the three placeholder values with your `apiKey`, `authDomain` (or `projectId`). Save.

That's it. The pill in the top bar will read **"Live · shared"** in green when it's connected, or **"Local only"** in amber if it's still in local mode.

## Where it lives

The page is at **`/yardsign`** (file: `yardsign/index.html`). It's not linked from anywhere on the site — you reach it only by typing the URL, e.g. `https://YOURSITE/yardsign`. Since the whole folder deploys as-is, it goes live on the next deploy with nothing else to configure.

Keep in mind an unlisted URL is hidden, not secured — anyone who has the link can open it and check spots on/off. That's fine for sharing with volunteers; just don't post it publicly. If you want a shared passcode gate, say the word.

## Editing the sign list later

The 70 locations live in the `LOCATIONS = [ ... ]` list inside the file. To add or remove a spot, edit that list (name + lat/lng). Or just send me the updated Google map and I'll regenerate it.
