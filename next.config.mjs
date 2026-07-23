/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Supabase Storage public URLs. Replace the hostname placeholder in
        // NEXT_PUBLIC_SUPABASE_URL — this pattern allows any *.supabase.co host.
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
