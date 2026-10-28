import Link from "next/link";

export default function RestaurantNotFound() {
  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto">
      <div className="text-4xl font-black text-[#FF6B1A]">404</div>
      <h2 className="text-lg font-bold text-gray-900">পেজটি পাওয়া যায়নি</h2>
      <Link
        href="/"
        className="inline-block px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-orange-600"
      >
        কিচেন ড্যাশবোর্ডে ফিরে যান
      </Link>
    </div>
  );
}
