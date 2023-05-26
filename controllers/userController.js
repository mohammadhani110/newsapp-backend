const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const UserModel = require("../models/userModel");

//@desc Register new user
//@route POST /api/auth/register
//@access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill all the fields");
  }

  // Check User Exists
  const userExists = await UserModel.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Hash Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create User
  const user = await UserModel.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isSubscribed: false,
      customer: "",
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid User data");
  }
});

//@desc Authenticate a user
//@route POST /api/auth/login
//@access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Invalid credentials!");
  }
  const user = await UserModel.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Set the refresh token as an HTTP-only cookie
    // res.cookie("refreshToken", refreshToken, {
    //   httpOnly: true,
    //   secure: true, // Enable this in a production environment with HTTPS
    //   sameSite: "none", // Enable this if your application uses cross-site requests
    // });

    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      isSubscribed: user.isSubscribed,
      customer: user.customer,
      token: generateToken(user._id),
      refreshToken: generateRefreshToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("User Not found!");
  }
});

//@desc fetch user data
//@route POST /api/auth/user
//@access Private
const getUser = asyncHandler(async (req, res) => {
  const { id } = req.body;
  try {
    // Find the user by their ID
    const user = await UserModel.findOne({ _id: id }).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    res.status(201).json(user);
  } catch (error) {
    res.status(400);
    throw new Error("Error updating user!");
  }
});
// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
};
