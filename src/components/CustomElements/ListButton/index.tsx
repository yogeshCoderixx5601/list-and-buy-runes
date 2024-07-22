import React from "react";
import { CircularProgress } from "@mui/material";

interface ListButtonProps {
  unsignedPsbtBase64: string;
  handleListAll: () => void;
  signTx: () => void;
  loading: boolean;
}

const ListButton: React.FC<ListButtonProps> = ({ unsignedPsbtBase64, handleListAll, signTx, loading }) => {
  return (
    <div className="w-full flex justify-center mt-4">
      {!unsignedPsbtBase64 ? (
        <div className="">
          <button
            onClick={handleListAll}
            className="custom-gradient text-white font-bold py-2 px-4 rounded cursor-pointer"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20}/>: "List All"}
          </button>
        </div>
      ) : (
        <button
          onClick={signTx}
          className="custom-gradient text-white font-bold py-2 px-4 rounded cursor-pointer"
          disabled={loading}
        >
          {loading ? <CircularProgress size={20}/> : "Sign All"}
        </button>
      )}
    </div>
  );
};

export default ListButton;
