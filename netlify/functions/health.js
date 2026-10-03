export default async () => {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Kamal Shuttler Academy API is running"
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};