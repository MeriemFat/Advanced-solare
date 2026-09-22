import User from "../models/User.js";

// List all users eligible for @mentions in comments
export async function getMentionableUsers(req, res) {
  const users = await User.find({})
    .select("_id name email role")
    .sort({ name: 1 })
    .lean();
  res.json(users);
}

// List all sub-admins and admins
export async function getSubadmins(req, res) {
  const users = await User.find({ role: { $in: ["admin", "subadmin"] } })
    .select("-password")
    .sort({ createdAt: -1 });
  res.json(users);
}

// Create a new sub-admin
export async function createSubadmin(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nom, email et mot de passe sont requis" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Cet email est déjà utilisé" });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "subadmin",
  });

  res.status(201).json({
    message: "Sous-administrateur créé avec succès",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

// Update a sub-admin
export async function updateSubadmin(req, res) {
  const { name, email, password, role } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  if (email && email.toLowerCase() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "Cet email est déjà utilisé" });
    }
    user.email = email.toLowerCase();
  }

  if (name) user.name = name;
  if (role && ["admin", "subadmin"].includes(role)) {
    user.role = role;
  }
  if (password && password.trim().length > 0) {
    user.password = password;
  }

  await user.save();

  res.json({
    message: "Sous-administrateur mis à jour avec succès",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

// Delete a sub-admin
export async function deleteSubadmin(req, res) {
  if (req.user.id === req.params.id) {
    return res.status(400).json({ message: "Vous ne pouvez pas supprimer votre propre compte" });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur introuvable" });
  }

  res.json({ message: "Sous-administrateur supprimé avec succès" });
}
