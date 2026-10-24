import { Subscriber } from "../models/Subscriber.js";

// Always answers the same way whether or not the email was already on the
// list, so the form can't be used to check who has subscribed.
export async function subscribe(req, res) {
  await Subscriber.updateOne({ email: req.valid.body.email }, { $setOnInsert: { email: req.valid.body.email } }, { upsert: true });
  res.status(201).json({ message: "You're on the list. We'll write when something good lands." });
}
