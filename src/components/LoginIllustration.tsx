import React from "react";

interface LoginIllustrationProps {
  headline?: string;
  subhead?: string;
}

export const LoginIllustration: React.FC<LoginIllustrationProps> = ({
  headline = "Good food. Smarter choices.",
  subhead = "Find what fits your cravings, budget and time.",
}) => {
  return (
    <div className="login-illustration-container">
      {/* Visual Art Canvas - Indian Campus Canteen Dining & Meal Decision Illustration */}
      <div className="login-illustration-art">
        <img
          src="/login-dining-illustration.png"
          alt="Campus dining thali and smart meal decision illustration"
          className="login-illustration-img"
          loading="eager"
        />
      </div>

      {/* Hero Headline & Subcopy matching dining theme */}
      <div className="login-illustration-copy">
        <h2 className="login-illustration-headline">{headline}</h2>
        <p className="login-illustration-subhead">{subhead}</p>
      </div>
    </div>
  );
};
