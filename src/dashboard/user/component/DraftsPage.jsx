import React from "react";
import DraftList from "../../../components/drafts/DraftList.jsx";

export default function DraftsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50/60 to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <DraftList />
      </div>
    </div>
  );
}

