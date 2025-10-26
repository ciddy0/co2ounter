import { Sprout } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
const Offset = () => {
  return (
    <Link href="/offset">
      <Button className="flex items-center gap-2 cursor-pointer bg-[#4a6b8a]">
        <Sprout /> Offset
      </Button>
    </Link>
  );
};

export default Offset;
