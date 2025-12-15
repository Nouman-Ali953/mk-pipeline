import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "../models/userModel.js";

export const signupUser = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await findUserByEmail(email);
  if (existing) return res.send("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  await createUser(name, email, hashedPassword);

  res.redirect("/login");
};
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await findUserByEmail(email);

  if (!user) {
    return res.redirect(`/login?error=Invalid email and password&oldEmail=${email}`);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.redirect(`/login?error=Invalid+email+or+password&oldEmail=${email}`);
  }

  req.session.user = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  return res.redirect("/");
};

export const logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
