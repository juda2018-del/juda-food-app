import DynamicRestaurantClient from "./DynamicRestaurantClient";

const restaurantIds = ["fayrouz", "shalteta", "khan", "alforn"];

export function generateStaticParams() {
  return restaurantIds.map((restaurantId) => ({ restaurantId }));
}

export default async function DynamicRestaurantPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  return <DynamicRestaurantClient restaurantId={restaurantId} />;
}
