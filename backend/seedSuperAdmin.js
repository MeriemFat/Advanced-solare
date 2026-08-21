import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

async function createSuperAdmin() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB Atlas");

    const email = "wa.bjaoui@gmail.com";
    const password = "wassimADV2026";
    const name = "Wassim Bjaoui";
    const role = "admin";

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.password = password; // pre-save hook will bcrypt hash it
      user.role = role;
      await user.save();
      console.log(`✅ Super Admin updated successfully: ${email}`);
    } else {
      user = await User.create({ name, email, password, role });
      console.log(`✅ Super Admin created successfully: ${email}`);
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Error creating Super Admin:", err);
    process.exit(1);
  }
}

createSuperAdmin();
