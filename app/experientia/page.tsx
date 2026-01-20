"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to signin page
    router.push("/signin");
  }, [router]);

  return (
    <main>
      <div>
        <h1>Redirecting to sign in...</h1>
      </div>
    </main>
  );
};

export default Home;
