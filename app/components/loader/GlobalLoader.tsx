"use client";
import React from "react";
import Lottie from "lottie-react";
import loadingAnimation from "./LoadingIcon.json";

const GlobalLoader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
            <div className="w-32 h-32">
                <Lottie animationData={loadingAnimation} loop={true} />
            </div>
        </div>
    );
};

export default GlobalLoader;
