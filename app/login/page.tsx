"use client";

import { useState } from "react";
import { supabase } from "@/lib/auth";

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [message, setMessage] = useState("");

    async function handleAuth() {
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                setMessage("Login successful!");

                window.location.href = "/";

            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            name,
                        },
                    },
                });

                if (error) throw error;

                setMessage("Account created successfully!");
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("Something went wrong");
            }
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">

                <h1 className="mb-6 text-center text-3xl font-bold">
                    {isLogin ? "Login" : "Sign Up"}
                </h1>

                <div className="space-y-4">
                    {!isLogin && (
                        <input
                            type="text"
                            placeholder="Your Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border px-4 py-3 outline-none"
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border px-4 py-3 outline-none"
                    />

                    <input
                        type="password"
                        placeholder="Create a Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border px-4 py-3 outline-none"
                    />

                    <button
                        onClick={handleAuth}
                        className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
                    >
                        {isLogin ? "Login" : "Sign Up"}
                    </button>

                    <p className="text-center text-sm text-gray-600">
                        {isLogin
                            ? "Don't have an account?"
                            : "Already have an account?"}

                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-1 text-blue-600"
                        >
                            {isLogin ? "Sign up" : "Login"}
                        </button>
                    </p>

                    {message && (
                        <p className="text-center text-sm text-red-500">
                            {message}
                        </p>
                    )}

                </div>
            </div>
        </div>
    );
}