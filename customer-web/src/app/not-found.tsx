import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl font-black text-[#FF6B1A] mb-3">404</div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        পৃষ্ঠাটি খুঁজে পাওয়া যায়নি (Page Not Found)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mb-6">
        আপনি যে পৃষ্ঠাটি খুঁজছেন তা সরিয়ে ফেলা হয়েছে বা এর লিংকটি সঠিক নয়।
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl font-bold text-white bg-[#FF6B1A] hover:bg-[#e05a10] shadow-md transition-all active:scale-95"
      >
        হোমপেজে ফিরে যান (Return Home)
      </Link>
    </div>
  );
}
