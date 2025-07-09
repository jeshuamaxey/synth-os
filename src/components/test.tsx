'use client'

import { useQuery } from "@tanstack/react-query";

const Test = () => {
  const q = useQuery({
    queryKey: ["test"],
    queryFn: () => {
      return "data response";
    },
  });

  return <div>{q.data}</div>;
};

export default Test;