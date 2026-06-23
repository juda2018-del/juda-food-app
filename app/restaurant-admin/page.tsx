  "use client";

import { useMemo, useState } from "react";
import type { Branch, Customer, MenuItem, Order, Priority, RestaurantAlert, Settings, Status } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/constants";
import { branches, drivers, initialAlerts, initialCustomers, initialMenu, initialOrders } from "@/data/mockData";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MiniStat } from "@/components/ui/MiniStat";
import { QuickActionsBar } from "@/components/restaurant-admin/QuickActionsBar";
import { ExecutiveDashboard } from "@/components/restaurant-admin/ExecutiveDashboard";
import { KpiCardsPro } from "@/components/restaurant-admin/KpiCardsPro";
import { RestaurantAlertsCenter } from "@/components/restaurant-admin/RestaurantAlertsCenter";
import { OrdersControlCenter } from "@/components/restaurant-admin/OrdersControlCenter";
import { RevenueAnalyticsPro } from "@/components/restaurant-admin/RevenueAnalyticsPro";
import { RestaurantReportsCenter } from "@/components/restaurant-admin/RestaurantReportsCenter";
import { SmartMenuPricingCenter } from "@/components/restaurant-admin/SmartMenuPricingCenter";
import { MenuAvailabilityAI } from "@/components/restaurant-admin/MenuAvailabilityAI";
import { PromotionAICenter } from "@/components/restaurant-admin/PromotionAICenter";

export default function RestaurantVendorDashboardPage() {
  const [restaurantOpen, setRestaurantOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu);
  const [alerts, setAlerts] = useState<RestaurantAlert[]>(initialAlerts);

  const [settings, setSettings] = useState<Settings>({
    openTime: "08:00",
    closeTime: "23:30",
    minOrder: 8000,
    deliveryFee: 2000,
    prepTime: 20,
    mode: "مفتوح",
  });

  const totalSales = useMemo(
    () => orders.reduce((sum, order) => sum + order.amount, 0),
    [orders]
  );

  function updateOrder(id: string, status: Status) {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  }

  function updateMenu(id: number, data: Partial<MenuItem>) {
    setMenu((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  }

  function updateAlert(id: number, data: Partial<RestaurantAlert>) {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, ...data } : alert))
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050505] px-4 py-5 text-white md:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-5">
        <QuickActionsBar
          restaurantOpen={restaurantOpen}
          setRestaurantOpen={setRestaurantOpen}
        />

        <ExecutiveDashboard
          totalSales={totalSales}
          restaurantOpen={restaurantOpen}
          settings={settings}
          orders={orders}
        />

        <KpiCardsPro orders={orders} totalSales={totalSales} settings={settings} />

        <AIInsightsBanner orders={orders} menu={menu} alerts={alerts} settings={settings} />
        <ExecutiveSummaryBar
          orders={orders}
          totalSales={totalSales}
          menu={menu}
          alerts={alerts}
          restaurantOpen={restaurantOpen}
          settings={settings}
        />

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <RestaurantAlertsCenter alerts={alerts} updateAlert={updateAlert} />
            <OrdersControlCenter orders={orders} updateOrder={updateOrder} />
            <RevenueAnalyticsPro orders={orders} />
            <AdvancedChartsAreaPro orders={orders} menu={menu} alerts={alerts} />
            <RevenueTrendsPanel orders={orders} />
            <OrdersTimelineBoard orders={orders} />
            <ActivityTimelinePro orders={orders} alerts={alerts} />
            <ModernTablesPro orders={orders} menu={menu} />
            <RestaurantReportsCenter orders={orders} menu={menu} />
            <SmartMenuPricingCenter menu={menu} updateMenu={updateMenu} />
            <MenuAvailabilityAI menu={menu} updateMenu={updateMenu} alerts={alerts} />
            <PromotionAICenter menu={menu} updateMenu={updateMenu} orders={orders} />
            <DeliverySpeedCenter orders={orders} />
            <KitchenEfficiencyCenter orders={orders} menu={menu} alerts={alerts} />
            <CustomerSatisfactionCenter orders={orders} menu={menu} alerts={alerts} />
            <RestaurantMenuManager menu={menu} updateMenu={updateMenu} />
            <LiveActivityFeed orders={orders} />
            <ChartsCenter orders={orders} />
            <HeatMapCenter />
          </div>

          <div className="space-y-5">
            <TodayGoalsCenter />
            <SmartNotificationsCenter orders={orders} alerts={alerts} menu={menu} />
            <LiveSystemStatusMonitor orders={orders} menu={menu} alerts={alerts} restaurantOpen={restaurantOpen} />
            <SmartAlertsTimeline alerts={alerts} orders={orders} menu={menu} />
            <RealTimePerformanceWidgets orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <AIRecommendationsPanel menu={menu} alerts={alerts} orders={orders} />
            <RestaurantHealthCenter orders={orders} menu={menu} alerts={alerts} />
            <DriverLeaderboard />
            <StaffPerformanceCenter />
            <BranchPerformanceCenter branches={branches} />
            <RevenueInsightsCenter orders={orders} />
            <ProfitCenter orders={orders} />
            <AutoOffersCenter menu={menu} updateMenu={updateMenu} />
            <SmartCampaignCenter menu={menu} orders={orders} alerts={alerts} />
            <OperationsCenter
              orders={orders}
              menu={menu}
              alerts={alerts}
              settings={settings}
            />
            <RestaurantCommandCenter
              orders={orders}
              menu={menu}
              alerts={alerts}
              restaurantOpen={restaurantOpen}
            />
            <CEOCommandCenter
              orders={orders}
              totalSales={totalSales}
              menu={menu}
              alerts={alerts}
              restaurantOpen={restaurantOpen}
              settings={settings}
            />
            <PeakHoursCenter />
            <TopProductsCenter menu={menu} />
            <CustomerRetentionCenter />
            <FleetPerformanceCenter />
            <DispatchAICenter orders={orders} />
            <LiveMapCenter />
            <CustomerInsightsCenter orders={orders} menu={menu} />
            <ForecastCenter orders={orders} menu={menu} alerts={alerts} />
            <SmartInventoryCenter menu={menu} />
            <FuseCopilotCenter />

            <MultiBranchCenter branches={branches} orders={orders} />
            <FranchiseCenter branches={branches} totalSales={totalSales} />
            <CRMPro customers={initialCustomers} orders={orders} />
            <LoyaltySystem customers={initialCustomers} orders={orders} />
            <MarketingCenter menu={menu} orders={orders} alerts={alerts} />
            <FinanceCenter orders={orders} totalSales={totalSales} />
            <AIBrainUltra
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
              settings={settings}
              restaurantOpen={restaurantOpen}
            />
            <PredictiveAnalytics
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
              settings={settings}
            />
            <DigitalTwinRestaurant
              orders={orders}
              menu={menu}
              alerts={alerts}
              restaurantOpen={restaurantOpen}
              settings={settings}
            />
            <VoiceCopilot orders={orders} alerts={alerts} settings={settings} />
            <CrisisCenter orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <BusinessHealthMonitor
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
              restaurantOpen={restaurantOpen}
            />
            <StrategicGoalsCenter orders={orders} totalSales={totalSales} menu={menu} />
            <AIAutomationCenter orders={orders} menu={menu} alerts={alerts} />

            <FleetEnterprise orders={orders} />
            <WarehouseCenter menu={menu} orders={orders} />
            <SupplierCenter menu={menu} alerts={alerts} />
            <HRCenter orders={orders} settings={settings} />
            <SmartAccounting orders={orders} totalSales={totalSales} />
            <AICEO orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <FUSEOS orders={orders} menu={menu} alerts={alerts} restaurantOpen={restaurantOpen} />
            <GlobalOperationsCenter branches={branches} orders={orders} totalSales={totalSales} />
            <CustomerAppUltra orders={orders} menu={menu} />
            <DriverAppUltra orders={orders} />
            <RestaurantAppUltra orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <FranchiseApp branches={branches} totalSales={totalSales} />
            <AnalyticsCloud orders={orders} menu={menu} alerts={alerts} branches={branches} />
            <AIAgents orders={orders} menu={menu} alerts={alerts} />
            <SmartCityDashboard orders={orders} branches={branches} />
            <AutonomousDispatch orders={orders} />
            <AICOO orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <AICFO orders={orders} totalSales={totalSales} />
            <AIMarketingDirector menu={menu} orders={orders} alerts={alerts} />
            <AICustomerAgent customers={initialCustomers} orders={orders} alerts={alerts} />
            <PredictiveSupplyChain menu={menu} orders={orders} alerts={alerts} />
            <AutonomousRestaurantNetwork branches={branches} orders={orders} />
            <FUSEUniverse orders={orders} menu={menu} alerts={alerts} branches={branches} totalSales={totalSales} />
            <SelfLearningEngine orders={orders} menu={menu} alerts={alerts} />
            <FutureSimulationCenter orders={orders} branches={branches} totalSales={totalSales} />
            <QuantumAICore orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <AIBoardOfDirectors orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <GlobalExpansionCenter branches={branches} orders={orders} totalSales={totalSales} />
            <RealTimeWorldMonitor orders={orders} menu={menu} alerts={alerts} restaurantOpen={restaurantOpen} />
            <AIWorkforce orders={orders} menu={menu} alerts={alerts} />
            <InnovationLab orders={orders} menu={menu} alerts={alerts} />
            <DigitalEarthDashboard branches={branches} orders={orders} totalSales={totalSales} />
            <InfiniteLearningEngine orders={orders} menu={menu} alerts={alerts} />
            <FUSEGalaxyPlatform orders={orders} menu={menu} alerts={alerts} branches={branches} totalSales={totalSales} />
            <AIChairman orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} restaurantOpen={restaurantOpen} />
            <AutonomousCompany orders={orders} menu={menu} alerts={alerts} branches={branches} totalSales={totalSales} />
            <GlobalFranchiseNetwork branches={branches} totalSales={totalSales} />
            <SmartEconomyEngine orders={orders} menu={menu} totalSales={totalSales} />
            <HyperPredictiveAI orders={orders} menu={menu} alerts={alerts} branches={branches} />
            <FUSEMetaverse orders={orders} branches={branches} totalSales={totalSales} />
            <UniversalOperationsSystem orders={orders} menu={menu} alerts={alerts} branches={branches} restaurantOpen={restaurantOpen} />
            <AIExecutiveCouncil orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <EternalLearningCore orders={orders} menu={menu} alerts={alerts} branches={branches} />
            <AIFounder orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} restaurantOpen={restaurantOpen} />
            <SelfEvolvingPlatform orders={orders} menu={menu} alerts={alerts} branches={branches} totalSales={totalSales} />
            <GlobalAutonomousNetwork orders={orders} branches={branches} alerts={alerts} />
            <InfiniteAnalytics orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <QuantumDecisionsEngine orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <DigitalCivilizationDashboard branches={branches} orders={orders} totalSales={totalSales} />
            <FUSENexus orders={orders} menu={menu} alerts={alerts} branches={branches} totalSales={totalSales} restaurantOpen={restaurantOpen} />
            <AutonomousAIAgentsNetwork orders={orders} menu={menu} alerts={alerts} />
            <RecursiveIntelligenceEngine orders={orders} menu={menu} alerts={alerts} branches={branches} />

            <ProductionArchitectureCenter orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <FirestoreLiveDataCenter />
            <AuthRolesMatrix />
            <RealDataMappingCenter orders={orders} menu={menu} alerts={alerts} />
            <NotificationPipelineCenter orders={orders} alerts={alerts} />
            <ReportsExportCenter orders={orders} menu={menu} totalSales={totalSales} />
            <GoLiveChecklist />

            <LiveFirestoreDashboard orders={orders} alerts={alerts} menu={menu} />
            <RealChartsCenter orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <LiveMapsCenter orders={orders} branches={branches} />
            <RolesPermissionsPro />
            <FinancePro orders={orders} totalSales={totalSales} />
            <CRMProReal customers={initialCustomers} orders={orders} />
            <AICopilotReal orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <MultiBranchLive branches={branches} orders={orders} totalSales={totalSales} />

            <PushNotificationsPro orders={orders} alerts={alerts} />
            <PDFReportsCenter orders={orders} menu={menu} totalSales={totalSales} />
            <ExcelExportCenter orders={orders} menu={menu} totalSales={totalSales} />
            <DriverTrackingLive orders={orders} />
            <KitchenMonitorPro orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <ForecastAIReal orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <SmartDispatchAI orders={orders} />
            <LoyaltyRewardsSystem customers={initialCustomers} orders={orders} />
            <MarketingAutomationPro menu={menu} orders={orders} alerts={alerts} />
            <AuditSecurityCenter orders={orders} alerts={alerts} />

            <UserRolesGuard />
            <ActivityLogsPro orders={orders} alerts={alerts} />
            <BackupRestoreCenter orders={orders} menu={menu} alerts={alerts} />
            <ErrorMonitoringCenter orders={orders} alerts={alerts} />
            <PerformanceAnalyticsPro orders={orders} menu={menu} alerts={alerts} settings={settings} />
            <BranchComparisonPro branches={branches} orders={orders} />
            <RevenueForecastAI orders={orders} totalSales={totalSales} branches={branches} />
            <GoLiveControlCenter orders={orders} menu={menu} alerts={alerts} restaurantOpen={restaurantOpen} />
            <ReleaseManagerPro />
            <V1LaunchChecklist />


            <V11ProductionCoreCenter orders={orders} menu={menu} alerts={alerts} totalSales={totalSales} />
            <LiveOrdersDashboardV11 orders={orders} totalSales={totalSales} />
            <AuthenticationRolesV11 />
            <RechartsReadyCenterV11 orders={orders} menu={menu} totalSales={totalSales} />
            <LiveNotificationsV11 orders={orders} alerts={alerts} />
            <OrdersMonitorProV11 orders={orders} updateOrder={updateOrder} />
            <DriversStatusMonitorV11 orders={orders} />
            <RestaurantsStatusCenterV11 branches={branches} restaurantOpen={restaurantOpen} />

            <GoogleMapsLiveCenter orders={orders} branches={branches} />
            <DriverTrackingLivePro orders={orders} />
            <FirebaseMessagingPro orders={orders} alerts={alerts} />
            <PDFExportPro orders={orders} menu={menu} totalSales={totalSales} />
            <ExcelExportPro orders={orders} menu={menu} totalSales={totalSales} />
            <AICopilotRealPro
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
            />
            <MultiBranchLivePro
              branches={branches}
              orders={orders}
              totalSales={totalSales}
            />
            <SmartDispatchAIReal orders={orders} />
            <ExecutiveAnalyticsPro
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
            />
            <SecurityCenterPro orders={orders} alerts={alerts} />
            <RestaurantSettingsCenter
              settings={settings}
              setSettings={setSettings}
            />

            <DriverOrdersCenter orders={orders} updateOrder={updateOrder} />
            <DriverEarningsCenter orders={orders} />
            <DriverHistoryCenter orders={orders} />
            <DriverRatingsCenter orders={orders} />
            <DriverOnlineControlCenter orders={orders} />

            <RestaurantOrdersCenter orders={orders} updateOrder={updateOrder} />
            <RestaurantMenuCenter menu={menu} updateMenu={updateMenu} />
            <RestaurantReportsCenter orders={orders} menu={menu} />
            <RestaurantNotificationsCenter orders={orders} menu={menu} alerts={alerts} updateAlert={updateAlert} />

            <ExecutiveKPICenter
              orders={orders}
              totalSales={totalSales}
              branches={branches}
              restaurantOpen={restaurantOpen}
            />
            <ExecutiveRevenueCenter
              orders={orders}
              totalSales={totalSales}
              branches={branches}
            />
            <ExecutiveAISummaryCenter
              orders={orders}
              menu={menu}
              alerts={alerts}
              totalSales={totalSales}
              branches={branches}
              restaurantOpen={restaurantOpen}
            />
            <BranchAnalyticsCenter branches={branches} orders={orders} totalSales={totalSales} />

            <PointsCenter customers={initialCustomers} orders={orders} />
            <RewardsCenter customers={initialCustomers} orders={orders} />
            <CouponsCenter customers={initialCustomers} orders={orders} menu={menu} />
            <CampaignsCenter customers={initialCustomers} orders={orders} menu={menu} />
            <PushCampaignCenter customers={initialCustomers} orders={orders} alerts={alerts} />
            <SmartOffersCenter customers={initialCustomers} orders={orders} menu={menu} alerts={alerts} />
            <ProductionReadyCenter orders={orders} menu={menu} alerts={alerts} branches={branches} />
            <LaunchStatusCenter orders={orders} menu={menu} alerts={alerts} branches={branches} restaurantOpen={restaurantOpen} />
            <SystemHealthCenter orders={orders} menu={menu} alerts={alerts} />
          </div>
        </div>
      </div>

      <AIAssistantFloatingWidget orders={orders} menu={menu} alerts={alerts} />
    </main>
  );
}

function priorityColor(priority: Priority) {
  if (priority === "عاجل") return "bg-red-500/15 text-red-300";
  if (priority === "مهم") return "bg-yellow-500/15 text-yellow-300";
  return "bg-white/10 text-white/55";
}

function statusAccent(status: Status) {
  if (status === "جديد") return "border-[#FF7A00]/40 bg-[#FF7A00]/10";
  if (status === "قيد التحضير") return "border-yellow-500/30 bg-yellow-500/10";
  if (status === "جاهز") return "border-sky-500/30 bg-sky-500/10";
  if (status === "قيد التوصيل") return "border-purple-500/30 bg-purple-500/10";
  if (status === "تم التسليم") return "border-green-500/30 bg-green-500/10";
  return "border-red-500/30 bg-red-500/10";
}

function nextStatus(status: Status): Status | null {
  if (status === "جديد") return "قيد التحضير";
  if (status === "قيد التحضير") return "جاهز";
  if (status === "جاهز") return "قيد التوصيل";
  if (status === "قيد التوصيل") return "تم التسليم";
  return null;
}

function DeliverySpeedCenter({ orders }: { orders: Order[] }) {
  return (
    <Card title="Delivery Speed Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="متوسط التوصيل" value="24 د" color="text-[#FF7A00]" />
        <MiniStat
          title="قيد التوصيل"
          value={orders.filter((order) => order.status === "قيد التوصيل").length}
          color="text-green-300"
        />
        <MiniStat
          title="جاهزة للسائق"
          value={orders.filter((order) => order.status === "جاهز").length}
          color="text-yellow-300"
        />
        <MiniStat
          title="قيد التحضير"
          value={orders.filter((order) => order.status === "قيد التحضير").length}
          color="text-white"
        />
      </div>
    </Card>
  );
}

function KitchenEfficiencyCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  return (
    <Card title="Kitchen Efficiency Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="متوسط التحضير" value="18 د" color="text-[#FF7A00]" />
        <MiniStat
          title="قيد التحضير"
          value={orders.filter((order) => order.status === "قيد التحضير").length}
          color="text-yellow-300"
        />
        <MiniStat
          title="أصناف متاحة"
          value={`${menu.filter((item) => !item.outOfStock).length}/${menu.length}`}
          color="text-green-300"
        />
        <MiniStat
          title="تنبيهات مطبخ"
          value={alerts.filter((alert) => alert.type === "مطبخ").length}
          color="text-red-300"
        />
      </div>
    </Card>
  );
}

function CustomerSatisfactionCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const complaints = alerts.filter(
    (alert) => alert.type === "جودة" || alert.type === "طلب"
  ).length;

  const score = Math.max(
    70,
    94 - complaints * 8 - menu.filter((item) => item.outOfStock).length * 4
  );

  return (
    <Card title="Customer Satisfaction Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="رضا العملاء" value={`${score}%`} color="text-green-300" />
        <MiniStat title="تقييم اليوم" value="4.7/5" color="text-[#FF7A00]" />
        <MiniStat title="شكاوى نشطة" value={complaints} color="text-red-300" />
        <MiniStat
          title="طلبات مكتملة"
          value={orders.filter((order) => order.status === "تم التسليم").length}
          color="text-white"
        />
      </div>
    </Card>
  );
}

function RestaurantMenuManager({
  menu,
  updateMenu,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
}) {
  return (
    <Card title="Restaurant Menu Manager">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {menu.map((item) => {
          const finalPrice = item.discount
            ? item.price - Math.round((item.price * item.discount) / 100)
            : item.price;

          return (
            <div key={item.id} className="rounded-3xl bg-white/5 p-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="text-xs text-white/45">{item.category}</p>
                </div>

                <Badge
                  text={item.outOfStock ? "نافد" : item.active ? "فعال" : "متوقف"}
                  color={
                    item.outOfStock
                      ? "bg-red-500/15 text-red-300"
                      : item.active
                      ? "bg-green-500/15 text-green-300"
                      : "bg-white/10 text-white/50"
                  }
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={item.price}
                  onChange={(event) =>
                    updateMenu(item.id, { price: Number(event.target.value) })
                  }
                  className="rounded-2xl bg-black px-3 py-3 text-sm outline-none"
                />

                <input
                  type="number"
                  value={item.discount}
                  onChange={(event) =>
                    updateMenu(item.id, { discount: Number(event.target.value) })
                  }
                  className="rounded-2xl bg-black px-3 py-3 text-sm outline-none"
                />
              </div>

              <p className="mt-2 text-sm text-[#FF7A00]">
                النهائي: {finalPrice.toLocaleString()} د.ع
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LiveActivityFeed({ orders }: { orders: Order[] }) {
  const activityEvents = orders.flatMap((order, index) => {
    const baseEvents = [
      {
        id: `${order.id}-created`,
        title: `وصل طلب جديد من ${order.customer}`,
        subtitle: `${order.id} — ${order.area} — ${order.amount.toLocaleString()} د.ع`,
        time: order.time,
        type: "طلب",
        level: order.priority,
      },
      {
        id: `${order.id}-kitchen`,
        title:
          order.status === "جديد"
            ? "بانتظار قبول المطبخ"
            : order.status === "قيد التحضير"
            ? "المطبخ بدأ التحضير"
            : order.status === "جاهز"
            ? "الطلب جاهز للتسليم"
            : order.status === "قيد التوصيل"
            ? "السائق استلم الطلب"
            : order.status === "تم التسليم"
            ? "تم تسليم الطلب بنجاح"
            : "تم رفض الطلب",
        subtitle: `الحالة الحالية: ${order.status} — وقت التحضير ${order.prepMinutes} د`,
        time: index % 2 === 0 ? "الآن" : order.time,
        type: order.status,
        level: order.priority,
      },
    ];

    if (order.priority === "عاجل") {
      baseEvents.push({
        id: `${order.id}-urgent`,
        title: "تنبيه عاجل من النظام",
        subtitle: "هذا الطلب يحتاج متابعة فورية حتى لا يتأخر على الزبون.",
        time: "الآن",
        type: "تنبيه",
        level: order.priority,
      });
    }

    return baseEvents;
  });

  const visibleEvents = activityEvents.slice(0, 9);
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;

  function eventStyle(type: string, level: Priority) {
    if (level === "عاجل") return "border-red-500/30 bg-red-500/10 text-red-300";
    if (type === "تم التسليم") return "border-green-500/30 bg-green-500/10 text-green-300";
    if (type === "قيد التوصيل") return "border-purple-500/30 bg-purple-500/10 text-purple-300";
    if (type === "جاهز") return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    if (type === "قيد التحضير") return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    return "border-[#FF7A00]/30 bg-[#FF7A00]/10 text-[#FF7A00]";
  }

  return (
    <Card
      title="Live Activity Feed Pro"
      action={
        <div className="rounded-2xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          Live Updates
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="نشاط مباشر" value={visibleEvents.length} color="text-[#FF7A00]" />
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="مكتملة / عاجلة" value={`${deliveredOrders} / ${urgentOrders}`} color="text-green-300" />
      </div>

      <div className="relative space-y-3 before:absolute before:right-4 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
        {visibleEvents.map((event) => (
          <div key={event.id} className="relative flex gap-3 pr-10">
            <div className={`absolute right-0 top-4 h-8 w-8 rounded-full border ${eventStyle(event.type, event.level)} flex items-center justify-center text-xs font-black`}>
              •
            </div>

            <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black text-white">{event.title}</p>
                  <p className="mt-1 text-sm text-white/50">{event.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge text={event.type} color={eventStyle(event.type, event.level)} />
                  <span className="text-xs text-white/35">{event.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DriverLeaderboard() {
  const totalDriverOrders = drivers.reduce((sum, driver) => sum + driver.orders, 0);
  const bestDriver = [...drivers].sort((a, b) => b.rating - a.rating || b.orders - a.orders)[0];

  return (
    <Card
      title="Driver Leaderboard Pro"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Fleet Ranking
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات السائقين" value={totalDriverOrders} color="text-[#FF7A00]" />
        <MiniStat title="أونلاين" value={drivers.filter((driver) => driver.online).length} color="text-green-300" />
        <MiniStat title="الأفضل" value={bestDriver?.name || "لا يوجد"} color="text-white" />
      </div>

      <div className="space-y-3">
        {drivers.map((driver, index) => {
          const share = totalDriverOrders
            ? Math.round((driver.orders / totalDriverOrders) * 100)
            : 0;

          return (
            <div key={driver.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">
                    #{index + 1} {driver.name}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    ⭐ {driver.rating} — متوسط الوصول {driver.speed}
                  </p>
                </div>

                <Badge
                  text={driver.online ? "Online" : "Offline"}
                  color={driver.online ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">طلبات اليوم</p>
                  <p className="mt-1 text-lg font-black text-[#FF7A00]">{driver.orders}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">حصة التشغيل</p>
                  <p className="mt-1 text-lg font-black text-white">{share}%</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function StaffPerformanceCenter() {
  return (
    <Card title="Staff Performance Center">
      <MiniStat title="أفضل موظف" value="حسين" color="text-green-300" />
      <div className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🧠 AI: زيد موظف تغليف وقت الذروة لتقليل التأخير.
      </div>
    </Card>
  );
}

function BranchPerformanceCenter({ branches }: { branches: Branch[] }) {
  return (
    <Card title="Branch Performance Center">
      <div className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{branch.name}</p>
                <p className="text-xs text-white/45">
                  {branch.area} — ⭐ {branch.rating}
                </p>
              </div>
              <span className="text-[#FF7A00]">
                {branch.sales.toLocaleString()} د.ع
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RevenueInsightsCenter({ orders }: { orders: Order[] }) {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const commission = Math.round(total * 0.12);

  return (
    <Card title="Revenue Insights Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat
          title="الإجمالي"
          value={`${total.toLocaleString()} د.ع`}
          color="text-[#FF7A00]"
        />
        <MiniStat
          title="الصافي"
          value={`${(total - commission).toLocaleString()} د.ع`}
          color="text-green-300"
        />
      </div>
    </Card>
  );
}

function ProfitCenter({ orders }: { orders: Order[] }) {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const cost = Math.round(total * 0.58);

  return (
    <Card title="Profit Center">
      <MiniStat
        title="ربح تقديري"
        value={`${(total - cost).toLocaleString()} د.ع`}
        color="text-green-300"
      />
    </Card>
  );
}

function AutoOffersCenter({
  menu,
  updateMenu,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
}) {
  const candidate = [...menu]
    .filter((item) => !item.outOfStock)
    .sort((a, b) => b.ordersToday - a.ordersToday)[0];

  return (
    <Card title="Auto Offers Center">
      <p className="text-sm text-white/60">أفضل عرض مقترح اليوم:</p>
      <p className="mt-2 font-black text-[#FF7A00]">{candidate?.name}</p>

      {candidate && (
        <button
          onClick={() => updateMenu(candidate.id, { discount: 10 })}
          className="mt-4 w-full rounded-2xl bg-[#FF7A00] p-3 font-black text-black"
        >
          تفعيل خصم 10%
        </button>
      )}
    </Card>
  );
}

function SmartCampaignCenter({
  menu,
  orders,
  alerts,
}: {
  menu: MenuItem[];
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  return (
    <Card title="Smart Campaign Center">
      <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
        حملة مقترحة: روّج لـ {menu[0]?.name} وقت الفطور مع توصيل مخفض.
        <br />
        الطلبات اليوم: {orders.length} — التنبيهات: {alerts.length}
      </div>
    </Card>
  );
}

function OperationsCenter({
  orders,
  menu,
  alerts,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  settings: Settings;
}) {
  return (
    <Card title="Operations Center">
      <div className="grid grid-cols-1 gap-3">
        <MiniStat
          title="طلبات نشطة"
          value={orders.filter((order) => order.status !== "تم التسليم").length}
          color="text-yellow-300"
        />
        <MiniStat
          title="أصناف نافدة"
          value={menu.filter((item) => item.outOfStock).length}
          color="text-red-300"
        />
        <MiniStat title="تنبيهات" value={alerts.length} color="text-[#FF7A00]" />
        <MiniStat title="تحضير" value={`${settings.prepTime} د`} color="text-white" />
      </div>
    </Card>
  );
}

function RestaurantCommandCenter({
  orders,
  menu,
  alerts,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  restaurantOpen: boolean;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const unavailableItems = menu.filter((item) => item.outOfStock).length;
  const commandScore = Math.max(
    45,
    100 - urgentOrders * 10 - highAlerts * 8 - unavailableItems * 6
  );

  const commandStatus = !restaurantOpen
    ? "مغلق"
    : commandScore >= 85
    ? "تشغيل ممتاز"
    : commandScore >= 70
    ? "تحت السيطرة"
    : "يحتاج تدخل";

  return (
    <Card
      title="Restaurant Command Center Pro"
      action={
        <Badge
          text={commandStatus}
          color={
            commandStatus === "تشغيل ممتاز"
              ? "bg-green-500/15 text-green-300"
              : commandStatus === "تحت السيطرة"
              ? "bg-yellow-500/15 text-yellow-300"
              : commandStatus === "مغلق"
              ? "bg-red-500/15 text-red-300"
              : "bg-[#FF7A00]/15 text-[#FF7A00]"
          }
        />
      }
    >
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/55">قرار التشغيل اللحظي</p>
            <h3 className="mt-1 text-2xl font-black text-white">{commandStatus}</h3>
          </div>
          <div className="text-left">
            <p className="text-sm text-white/45">Command Score</p>
            <p className="text-3xl font-black text-[#FF7A00]">{commandScore}%</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${commandScore}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="طلبات عاجلة" value={urgentOrders} color="text-red-300" />
        <MiniStat title="تنبيهات عالية" value={highAlerts} color="text-[#FF7A00]" />
        <MiniStat title="أصناف نافدة" value={unavailableItems} color="text-red-300" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-white/65">
        <p>• {urgentOrders > 0 ? "حرّك الطلبات العاجلة قبل باقي الطلبات." : "لا توجد طلبات عاجلة حالياً."}</p>
        <p>• {unavailableItems > 0 ? "اخفِ الأصناف النافدة من المنيو مباشرة." : "توفر المنيو جيد."}</p>
        <p>• {highAlerts > 0 ? "عالج التنبيهات العالية قبل ساعة الذروة." : "التنبيهات تحت السيطرة."}</p>
      </div>
    </Card>
  );
}

function CEOCommandCenter({
  orders,
  totalSales,
  menu,
  alerts,
  restaurantOpen,
  settings,
}: {
  orders: Order[];
  totalSales: number;
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  restaurantOpen: boolean;
  settings: Settings;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const deliveredOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const delayedOrders = orders.filter(
    (order) =>
      ["قيد التحضير", "جاهز", "قيد التوصيل"].includes(order.status) &&
      order.prepMinutes > settings.prepTime
  ).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const unresolvedAlerts = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const outOfStockItems = menu.filter((item) => item.outOfStock).length;
  const activeMenuItems = menu.filter((item) => item.active && !item.outOfStock).length;

  const averageOrder = orders.length ? Math.round(totalSales / orders.length) : 0;
  const commission = Math.round(totalSales * 0.12);
  const estimatedCost = Math.round(totalSales * 0.58);
  const netRevenue = totalSales - commission;
  const estimatedProfit = totalSales - commission - estimatedCost;
  const profitMargin = totalSales ? Math.round((estimatedProfit / totalSales) * 100) : 0;
  const completionRate = orders.length
    ? Math.round((deliveredOrders / orders.length) * 100)
    : 0;
  const branchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const bestBranch = [...branches].sort((a, b) => b.sales - a.sales)[0];
  const weakestBranch = [...branches].sort((a, b) => a.rating - b.rating)[0];

  const riskScore = Math.min(
    100,
    urgentOrders * 14 + delayedOrders * 12 + highAlerts * 10 + outOfStockItems * 9
  );
  const ceoScore = Math.max(
    45,
    100 - riskScore + (restaurantOpen ? 0 : -18) + Math.min(8, completionRate / 10)
  );
  const ceoStatus =
    ceoScore >= 88
      ? "نمو ممتاز"
      : ceoScore >= 75
      ? "تشغيل مسيطر"
      : ceoScore >= 62
      ? "متابعة مطلوبة"
      : "تدخل إداري";

  const riskRadar = [
    {
      title: "ضغط الطلبات",
      value: activeOrders,
      level: activeOrders >= 4 ? "عالي" : activeOrders >= 2 ? "متوسط" : "منخفض",
      color: activeOrders >= 4 ? "text-red-300" : activeOrders >= 2 ? "text-yellow-300" : "text-green-300",
    },
    {
      title: "طلبات متأخرة",
      value: delayedOrders,
      level: delayedOrders > 0 ? "عالي" : "منخفض",
      color: delayedOrders > 0 ? "text-red-300" : "text-green-300",
    },
    {
      title: "تنبيهات حرجة",
      value: highAlerts,
      level: highAlerts > 0 ? "عالي" : "منخفض",
      color: highAlerts > 0 ? "text-red-300" : "text-green-300",
    },
    {
      title: "نفاد مخزون",
      value: outOfStockItems,
      level: outOfStockItems > 0 ? "متوسط" : "منخفض",
      color: outOfStockItems > 0 ? "text-yellow-300" : "text-green-300",
    },
  ];

  const executiveDecisions = [
    urgentOrders > 0
      ? `وجّه الفريق لتحريك ${urgentOrders} طلب عاجل فوراً قبل أي طلب عادي.`
      : "لا توجد طلبات عاجلة؛ حافظ على نفس سرعة التشغيل.",
    delayedOrders > 0
      ? `راجع ${delayedOrders} طلب متأخر وزد دعم المطبخ/التغليف مؤقتاً.`
      : "زمن التحضير ضمن السيطرة حالياً.",
    outOfStockItems > 0
      ? `أوقف الأصناف النافدة وعدّل المنيو قبل ما تزيد الإلغاءات.`
      : "توفر المنيو جيد ويمكن دفع العروض على الأصناف الأعلى طلباً.",
    profitMargin < 25
      ? "الهامش يحتاج مراجعة: قلّل الخصومات أو ارفع أسعار الأصناف الأعلى طلباً تدريجياً."
      : "الهامش جيد؛ استثمر بعرض خفيف لرفع حجم الطلبات.",
  ];

  const growthOpportunities = [
    {
      title: "فرع النمو الأعلى",
      value: bestBranch?.name || "لا يوجد",
      hint: `${bestBranch?.sales.toLocaleString() || 0} د.ع مبيعات فرعية`,
    },
    {
      title: "فرع يحتاج متابعة",
      value: weakestBranch?.name || "لا يوجد",
      hint: `تقييم ${weakestBranch?.rating || 0}/5`,
    },
    {
      title: "فرصة رفع السلة",
      value: `${Math.round(averageOrder * 1.12).toLocaleString()} د.ع`,
      hint: "Bundle + مشروب يرفع متوسط الطلب",
    },
  ];

  return (
    <Card
      title="CEO Command Center Pro Ultra"
      action={
        <Badge
          text={ceoStatus}
          color={
            ceoStatus === "نمو ممتاز"
              ? "bg-green-500/15 text-green-300"
              : ceoStatus === "تشغيل مسيطر"
              ? "bg-[#FF7A00]/15 text-[#FF7A00]"
              : ceoStatus === "متابعة مطلوبة"
              ? "bg-yellow-500/15 text-yellow-300"
              : "bg-red-500/15 text-red-300"
          }
        />
      }
    >
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/25 bg-gradient-to-br from-[#FF7A00]/20 to-white/5 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold text-white/45">CEO Health Score</p>
            <h3 className="mt-2 text-3xl font-black text-white">{ceoScore}%</h3>
            <p className="mt-2 text-sm text-white/60">
              قراءة تنفيذية تجمع الطلبات، المخزون، المخاطر، الإيراد، الربحية وحالة التشغيل.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs text-white/45">Final Command</p>
            <p className="mt-1 text-xl font-black text-[#FF7A00]">{ceoStatus}</p>
            <p className="mt-1 text-xs text-white/35">
              {restaurantOpen ? `Mode: ${settings.mode}` : "المطعم مغلق"}
            </p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${ceoScore}%` }} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat title="إيراد اليوم" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="صافي بعد العمولة" value={`${netRevenue.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="ربح تقديري" value={`${estimatedProfit.toLocaleString()} د.ع`} color={estimatedProfit > 0 ? "text-green-300" : "text-red-300"} />
        <MiniStat title="هامش الربح" value={`${profitMargin}%`} color={profitMargin >= 25 ? "text-green-300" : "text-yellow-300"} />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="نسبة الإنجاز" value={`${completionRate}%`} color="text-green-300" />
        <MiniStat title="تنبيهات مفتوحة" value={unresolvedAlerts} color="text-red-300" />
        <MiniStat title="أصناف فعالة" value={`${activeMenuItems}/${menu.length}`} color="text-white" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-black">Multi Branch Overview</p>
            <span className="text-xs text-white/35">إجمالي الفروع: {branchSales.toLocaleString()} د.ع</span>
          </div>
          <div className="space-y-3">
            {branches.map((branch) => {
              const share = branchSales ? Math.round((branch.sales / branchSales) * 100) : 0;
              return (
                <div key={branch.id} className="rounded-2xl bg-black/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">{branch.name}</p>
                      <p className="text-xs text-white/40">
                        {branch.area} — {branch.orders} طلب — ⭐ {branch.rating}
                      </p>
                    </div>
                    <Badge
                      text={branch.status}
                      color={
                        branch.status === "ممتاز"
                          ? "bg-green-500/15 text-green-300"
                          : branch.status === "جيد"
                          ? "bg-yellow-500/15 text-yellow-300"
                          : "bg-red-500/15 text-red-300"
                      }
                    />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    {branch.sales.toLocaleString()} د.ع — حصة {share}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 font-black">Profit / Cost / Commission</p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between rounded-2xl bg-black/40 p-3">
              <span className="text-white/45">الإجمالي</span>
              <span className="font-black text-[#FF7A00]">{totalSales.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-black/40 p-3">
              <span className="text-white/45">عمولة FUSE</span>
              <span className="font-black text-yellow-300">{commission.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-black/40 p-3">
              <span className="text-white/45">تكلفة تقديرية</span>
              <span className="font-black text-red-300">{estimatedCost.toLocaleString()} د.ع</span>
            </div>
            <div className="flex justify-between rounded-2xl bg-green-500/10 p-3">
              <span className="text-white/65">صافي ربح</span>
              <span className="font-black text-green-300">{estimatedProfit.toLocaleString()} د.ع</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-black">Operational Risk Radar</p>
            <Badge
              text={`Risk ${riskScore}%`}
              color={riskScore >= 55 ? "bg-red-500/15 text-red-300" : riskScore >= 30 ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {riskRadar.map((risk) => (
              <div key={risk.title} className="rounded-2xl bg-black/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-white/55">{risk.title}</p>
                  <span className={`text-sm font-black ${risk.color}`}>{risk.level}</span>
                </div>
                <p className={`mt-2 text-2xl font-black ${risk.color}`}>{risk.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 font-black">Alerts Priority Board</p>
          <div className="space-y-3">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="rounded-2xl bg-black/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{alert.title}</p>
                    <p className="mt-1 text-xs text-white/40">{alert.message}</p>
                  </div>
                  <Badge
                    text={alert.level}
                    color={
                      alert.level === "عالي"
                        ? "bg-red-500/15 text-red-300"
                        : alert.level === "متوسط"
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-green-500/15 text-green-300"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 font-black">Restaurant Performance Matrix</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {growthOpportunities.map((item) => (
            <div key={item.title} className="rounded-2xl bg-black/40 p-4">
              <p className="text-xs text-white/40">{item.title}</p>
              <p className="mt-2 text-xl font-black text-white">{item.value}</p>
              <p className="mt-1 text-xs text-[#FF7A00]">{item.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="mb-3 font-black text-white">AI Executive Decisions</p>
        <div className="space-y-2 text-sm text-white/70">
          {executiveDecisions.map((decision) => (
            <p key={decision}>• {decision}</p>
          ))}
        </div>
      </div>
    </Card>
  );
}

function RestaurantHealthCenter({
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const score = Math.max(
    50,
    100 - alerts.length * 6 - menu.filter((item) => item.outOfStock).length * 8
  );

  return (
    <Card title="Restaurant Health Center">
      <MiniStat
        title="صحة التشغيل"
        value={`${score}%`}
        color={score >= 80 ? "text-green-300" : "text-yellow-300"}
      />
    </Card>
  );
}

function TodayGoalsCenter() {
  return (
    <Card title="Today Goals Center">
      <div className="space-y-3 text-sm text-white/65">
        <p>✅ الوصول إلى 150 طلب</p>
        <p>✅ تقليل التحضير إلى 18 دقيقة</p>
        <p>✅ رفع التقييم إلى 4.8</p>
      </div>
    </Card>
  );
}

function AIRecommendationsPanel({
  menu,
  alerts,
  orders,
}: {
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  orders: Order[];
}) {
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const topProduct = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];

  const recommendations = [
    {
      title: outOfStock > 0 ? "إخفاء الأصناف النافدة" : "توفر المنيو مستقر",
      body:
        outOfStock > 0
          ? `يوجد ${outOfStock} صنف نافد. إخفاؤها يقلل الإلغاء والشكاوى.`
          : "كل الأصناف الحرجة متوفرة حالياً.",
      action: outOfStock > 0 ? "نفّذ الآن" : "مراقبة",
      color: outOfStock > 0 ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-green-500/25 bg-green-500/10 text-green-300",
    },
    {
      title: highAlerts > 0 ? "تنبيهات تحتاج تدخل" : "التنبيهات تحت السيطرة",
      body:
        highAlerts > 0
          ? `عندك ${highAlerts} تنبيه عالي. الأفضل حلها قبل الذروة.`
          : "لا توجد تنبيهات عالية حالياً.",
      action: highAlerts > 0 ? "راجع التنبيهات" : "تمام",
      color: highAlerts > 0 ? "border-yellow-500/25 bg-yellow-500/10 text-yellow-300" : "border-green-500/25 bg-green-500/10 text-green-300",
    },
    {
      title: urgentOrders > 0 ? "أولوية للطلبات العاجلة" : "الضغط طبيعي",
      body:
        urgentOrders > 0
          ? `حرّك ${urgentOrders} طلب عاجل داخل البورد حتى لا يتأخر.`
          : `الطلبات النشطة ${activeOrders} وتحت السيطرة.`,
      action: urgentOrders > 0 ? "حرّك الطلب" : "مستقر",
      color: urgentOrders > 0 ? "border-red-500/25 bg-red-500/10 text-red-300" : "border-white/10 bg-white/5 text-white/70",
    },
    {
      title: "عرض ذكي مقترح",
      body: topProduct
        ? `روّج لـ ${topProduct.name} لأنه الأعلى طلباً اليوم (${topProduct.ordersToday} طلب).`
        : "لا توجد بيانات كافية للمنيو.",
      action: "فعّل حملة",
      color: "border-[#FF7A00]/25 bg-[#FF7A00]/10 text-[#FF7A00]",
    },
  ];

  return (
    <Card
      title="AI Recommendations Pro"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Smart Actions
        </div>
      }
    >
      <div className="space-y-3">
        {recommendations.map((item) => (
          <div key={item.title} className={`rounded-3xl border p-4 ${item.color}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 text-sm text-white/60">{item.body}</p>
              </div>
              <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-black">
                {item.action}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PeakHoursCenter() {
  return (
    <Card title="Peak Hours Center">
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-2xl bg-white/5 p-3">9-11 ص</div>
        <div className="rounded-2xl bg-[#FF7A00]/20 p-3 text-[#FF7A00]">
          1-3 م
        </div>
        <div className="rounded-2xl bg-white/5 p-3">8-10 م</div>
      </div>
    </Card>
  );
}

function TopProductsCenter({ menu }: { menu: MenuItem[] }) {
  const top = [...menu].sort((a, b) => b.ordersToday - a.ordersToday);

  return (
    <Card title="Top Products Center">
      <div className="space-y-3">
        {top.map((item) => (
          <div
            key={item.id}
            className="flex justify-between rounded-2xl bg-white/5 p-3 text-sm"
          >
            <span>{item.name}</span>
            <span className="text-[#FF7A00]">{item.ordersToday}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CustomerRetentionCenter() {
  return (
    <Card title="Customer Retention Center">
      <MiniStat title="زبائن راجعين" value="42%" color="text-green-300" />
    </Card>
  );
}

function ChartsCenter({ orders }: { orders: Order[] }) {
  const values = [35, 55, 44, 70, 60, 85, 78];

  return (
    <Card title="Charts Center">
      <div className="mb-4 text-sm text-white/50">
        مجموع الطلبات المعروضة: {orders.length}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {values.map((value, index) => (
          <div
            key={index}
            className="flex h-28 items-end rounded-2xl bg-white/5 p-2"
          >
            <div
              className="w-full rounded-xl bg-[#FF7A00]"
              style={{ height: `${value}%` }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function HeatMapCenter() {
  const areas = [
    { name: "زيونة", orders: 42, demand: "عالي" },
    { name: "الكرادة", orders: 36, demand: "عالي" },
    { name: "المنصور", orders: 28, demand: "متوسط" },
    { name: "الجادرية", orders: 24, demand: "متوسط" },
    { name: "الأعظمية", orders: 18, demand: "مستقر" },
    { name: "الحارثية", orders: 15, demand: "مستقر" },
    { name: "اليرموك", orders: 12, demand: "منخفض" },
    { name: "بغداد الجديدة", orders: 9, demand: "منخفض" },
  ];

  const hottestArea = [...areas].sort((a, b) => b.orders - a.orders)[0];

  function heatStyle(demand: string) {
    if (demand === "عالي") return "bg-[#FF7A00] text-black border-[#FF7A00]";
    if (demand === "متوسط") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/25";
    if (demand === "مستقر") return "bg-green-500/10 text-green-300 border-green-500/20";
    return "bg-white/5 text-white/45 border-white/10";
  }

  return (
    <Card
      title="Heat Map Pro"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Hot Area: {hottestArea.name}
        </div>
      }
    >
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🧠 أعلى طلب حالياً في {hottestArea.name}. زيد توفر السائقين والعروض بهذه المنطقة.
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {areas.map((area) => (
          <div key={area.name} className={`rounded-3xl border p-4 ${heatStyle(area.demand)}`}>
            <p className="font-black">{area.name}</p>
            <p className="mt-2 text-2xl font-black">{area.orders}</p>
            <p className="mt-1 text-xs opacity-70">طلب — {area.demand}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FleetPerformanceCenter() {
  return (
    <Card title="Fleet Performance Center">
      <MiniStat
        title="سائقين أونلاين"
        value={drivers.filter((driver) => driver.online).length}
        color="text-green-300"
      />
    </Card>
  );
}

function DispatchAICenter({ orders }: { orders: Order[] }) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  );
  const readyOrders = orders.filter((order) => order.status === "جاهز");
  const deliveringOrders = orders.filter((order) => order.status === "قيد التوصيل");
  const delayedOrders = activeOrders.filter(
    (order) => order.prepMinutes >= 22 || order.priority === "عاجل"
  );
  const urgentOrders = orders.filter((order) => order.priority === "عاجل");

  const driverStats = drivers.map((driver) => {
    const assignedOrders = orders.filter((order) => order.driver === driver.name);
    const activeAssigned = assignedOrders.filter(
      (order) => !["تم التسليم", "مرفوض"].includes(order.status)
    ).length;
    const deliveredAssigned = assignedOrders.filter(
      (order) => order.status === "تم التسليم"
    ).length;
    const speedNumber = Number(driver.speed.replace(" د", ""));
    const loadPenalty = activeAssigned * 8;
    const speedScore = Math.max(40, 100 - speedNumber * 1.8);
    const ratingScore = Math.round(driver.rating * 18);
    const efficiency = Math.max(
      55,
      Math.min(99, Math.round((speedScore + ratingScore) / 2 - loadPenalty + deliveredAssigned * 4))
    );

    return {
      ...driver,
      activeAssigned,
      deliveredAssigned,
      speedNumber,
      efficiency,
      load: activeAssigned >= 3 ? "ضغط عالي" : activeAssigned >= 2 ? "متوسط" : "متاح",
    };
  });

  const bestDriver = [...driverStats].sort(
    (a, b) => b.efficiency - a.efficiency || a.activeAssigned - b.activeAssigned
  )[0];

  const dispatchScore = Math.max(
    45,
    Math.min(
      98,
      94 - delayedOrders.length * 8 - readyOrders.length * 4 + drivers.filter((driver) => driver.online).length * 3
    )
  );

  const highDemandAreas = [
    { name: "زيونة", demand: 92, distance: "2.4 كم", traffic: "خفيف", eta: 12 },
    { name: "الكرادة", demand: 84, distance: "4.1 كم", traffic: "متوسط", eta: 18 },
    { name: "الجادرية", demand: 73, distance: "5.7 كم", traffic: "متوسط", eta: 22 },
    { name: "المنصور", demand: 66, distance: "7.8 كم", traffic: "مزدحم", eta: 31 },
  ];

  const routeSuggestions = readyOrders.length
    ? readyOrders.map((order, index) => ({
        id: order.id,
        area: order.area,
        driver: index === 0 ? bestDriver?.name || "أبو علي" : driverStats[index % driverStats.length]?.name || "حيدر",
        eta: Math.max(10, order.prepMinutes + 6 - index * 2),
        traffic: index % 2 === 0 ? "طريق سريع" : "طريق بديل",
      }))
    : activeOrders.slice(0, 3).map((order, index) => ({
        id: order.id,
        area: order.area,
        driver: driverStats[index % driverStats.length]?.name || "أبو علي",
        eta: Math.max(12, order.prepMinutes + 8),
        traffic: order.priority === "عاجل" ? "أولوية عاجلة" : "مسار عادي",
      }));

  const fleetHealth = Math.max(
    50,
    Math.min(99, Math.round(driverStats.reduce((sum, driver) => sum + driver.efficiency, 0) / driverStats.length))
  );

  function chipColor(value: string) {
    if (["ضغط عالي", "مزدحم", "أولوية عاجلة"].includes(value)) return "bg-red-500/15 text-red-300";
    if (["متوسط", "طريق بديل"].includes(value)) return "bg-yellow-500/15 text-yellow-300";
    return "bg-green-500/15 text-green-300";
  }

  return (
    <Card
      title="Dispatch AI Pro"
      action={
        <Badge
          text={`Fleet Health ${fleetHealth}%`}
          color={fleetHealth >= 80 ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
        />
      }
    >
      <div className="mb-5 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#FF7A00]">AI Driver Assignment</p>
            <h3 className="mt-2 text-3xl font-black text-white">
              السائق المقترح: {bestDriver?.name || "أبو علي"}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              اختيار ذكي حسب السرعة، التقييم، الحمل الحالي، والطلبات الجاهزة للتوصيل.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-center">
            <p className="text-xs text-white/40">Dispatch Score</p>
            <p className="mt-1 text-4xl font-black text-[#FF7A00]">{dispatchScore}%</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${dispatchScore}%` }} />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات جاهزة" value={readyOrders.length} color="text-sky-300" />
        <MiniStat title="قيد التوصيل" value={deliveringOrders.length} color="text-purple-300" />
        <MiniStat title="طلبات متأخرة" value={delayedOrders.length} color="text-red-300" />
        <MiniStat title="سائقين أونلاين" value={drivers.filter((driver) => driver.online).length} color="text-green-300" />
      </div>

      {delayedOrders.length > 0 && (
        <div className="mb-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="font-black text-red-200">Delayed Orders Alerts</p>
          <p className="mt-1 text-sm text-white/60">
            يوجد {delayedOrders.length} طلب يحتاج تدخل سريع. أعطِ أولوية للطلبات العاجلة قبل باقي المسارات.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-black">Best Driver Recommendation</h3>
            <Badge text={bestDriver?.load || "متاح"} color={chipColor(bestDriver?.load || "متاح")} />
          </div>

          <div className="space-y-3">
            {driverStats.map((driver) => (
              <div key={driver.name} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{driver.name}</p>
                    <p className="mt-1 text-xs text-white/45">
                      ⭐ {driver.rating} — سرعة {driver.speed} — حمل نشط {driver.activeAssigned}
                    </p>
                  </div>
                  <Badge text={`${driver.efficiency}%`} color={driver.efficiency >= 85 ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${driver.efficiency}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-black">Smart Route Suggestions</h3>
            <Badge text={`${routeSuggestions.length} مسار`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />
          </div>

          <div className="space-y-3">
            {routeSuggestions.map((route) => (
              <div key={route.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{route.id} → {route.area}</p>
                    <p className="mt-1 text-xs text-white/45">السائق: {route.driver} — وصول متوقع {route.eta} د</p>
                  </div>
                  <Badge text={route.traffic} color={chipColor(route.traffic)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">High Demand Areas</h3>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {highDemandAreas.map((area) => (
              <div key={area.name} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{area.name}</p>
                    <p className="mt-1 text-xs text-white/45">{area.distance} — ETA {area.eta} د</p>
                  </div>
                  <Badge text={area.traffic} color={chipColor(area.traffic)} />
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${area.demand}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Driver Load Balancing</h3>
          <div className="mt-4 space-y-3">
            {driverStats.map((driver) => {
              const loadValue = Math.min(100, driver.activeAssigned * 32 + driver.orders * 2);
              return (
                <div key={driver.name}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{driver.name}</span>
                    <span className="text-white/45">{driver.load}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${driver.load === "ضغط عالي" ? "bg-red-500" : driver.load === "متوسط" ? "bg-yellow-500" : "bg-green-500"}`}
                      style={{ width: `${loadValue}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4 text-sm text-white/70">
            🧠 AI: وزّع الطلبات الجاهزة على أقل سائق ضغطاً، وخلي {bestDriver?.name || "أبو علي"} للطلبات العاجلة.
          </div>
        </div>
      </div>
    </Card>
  );
}

function LiveMapCenter() {
  return (
    <Card title="Live Map Center">
      <div className="h-40 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.25),transparent_60%)] p-4 text-sm text-white/50">
        خريطة مباشرة للسائقين والطلبات.
      </div>
    </Card>
  );
}

function CustomerInsightsCenter({
  orders,
  menu,
}: {
  orders: Order[];
  menu: MenuItem[];
}) {
  const [selectedSegment, setSelectedSegment] = useState<
    "الكل" | Customer["segment"]
  >("الكل");

  const customers = initialCustomers;
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((customer) => customer.orders >= 3).length;
  const returningCustomers = customers.filter((customer) => customer.returning).length;
  const newCustomers = Math.max(0, totalCustomers - returningCustomers);
  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const avgBasket = orders.length
    ? Math.round(orders.reduce((sum, order) => sum + order.amount, 0) / orders.length)
    : Math.round(totalSpend / Math.max(1, totalCustomers));
  const retentionRate = totalCustomers
    ? Math.round((returningCustomers / totalCustomers) * 100)
    : 0;
  const satisfaction = totalCustomers
    ? Math.round(
        customers.reduce((sum, customer) => sum + customer.satisfaction, 0) /
          totalCustomers
      )
    : 0;
  const churnRisk = customers.filter(
    (customer) => customer.segment === "At Risk" || customer.satisfaction < 70
  );
  const vipCustomers = customers.filter((customer) => customer.segment === "VIP");
  const healthScore = Math.max(
    48,
    Math.min(
      99,
      Math.round(
        retentionRate * 0.35 +
          satisfaction * 0.35 +
          Math.min(100, activeCustomers * 14) * 0.2 +
          Math.max(0, 100 - churnRisk.length * 14) * 0.1
      )
    )
  );

  const segmentCounts = [
    {
      label: "VIP",
      value: customers.filter((customer) => customer.segment === "VIP").length,
      color: "text-[#FF7A00]",
    },
    {
      label: "Frequent",
      value: customers.filter((customer) => customer.segment === "Frequent").length,
      color: "text-green-300",
    },
    {
      label: "Normal",
      value: customers.filter((customer) => customer.segment === "Normal").length,
      color: "text-yellow-300",
    },
    {
      label: "At Risk",
      value: churnRisk.length,
      color: "text-red-300",
    },
  ];

  const filteredCustomers =
    selectedSegment === "الكل"
      ? customers
      : customers.filter((customer) => customer.segment === selectedSegment);

  const topCustomers = [...filteredCustomers].sort(
    (a, b) => b.totalSpend - a.totalSpend || b.orders - a.orders
  );

  const peakHours = [
    { label: "8-10 ص", value: 68 },
    { label: "10-12 ظ", value: 82 },
    { label: "12-2 م", value: 76 },
    { label: "2-4 م", value: 58 },
    { label: "4-6 م", value: 64 },
    { label: "6-8 م", value: 91 },
    { label: "8-10 م", value: 88 },
  ];

  const categoryDemand = menu
    .reduce<{ category: string; orders: number }[]>((acc, item) => {
      const existing = acc.find((entry) => entry.category === item.category);
      if (existing) {
        existing.orders += item.ordersToday;
      } else {
        acc.push({ category: item.category, orders: item.ordersToday });
      }
      return acc;
    }, [])
    .sort((a, b) => b.orders - a.orders);

  const maxCategoryOrders = Math.max(
    1,
    ...categoryDemand.map((category) => category.orders)
  );

  const aiRecommendations = [
    {
      title: "استرجاع العملاء المعرضين للتوقف",
      body: `أرسل كوبون 15% إلى ${churnRisk.length} زبائن At Risk خلال 24 ساعة.`,
      color:
        churnRisk.length > 0
          ? "border-red-500/25 bg-red-500/10"
          : "border-green-500/25 bg-green-500/10",
    },
    {
      title: "زيادة متوسط السلة",
      body: `متوسط السلة ${avgBasket.toLocaleString()} د.ع. اقترح إضافة مشروب أو بورك عند الطلب.`,
      color: "border-[#FF7A00]/25 bg-[#FF7A00]/10",
    },
    {
      title: "تقوية ولاء VIP",
      body: `عندك ${vipCustomers.length} زبون VIP. فعّل لهم أولوية تجهيز أو توصيل مخفض.`,
      color: "border-yellow-500/25 bg-yellow-500/10",
    },
  ];

  function segmentBadge(segment: Customer["segment"]) {
    if (segment === "VIP") return "bg-[#FF7A00]/15 text-[#FF7A00]";
    if (segment === "Frequent") return "bg-green-500/15 text-green-300";
    if (segment === "Normal") return "bg-yellow-500/15 text-yellow-300";
    return "bg-red-500/15 text-red-300";
  }

  function healthColor(value: number) {
    if (value >= 85) return "bg-green-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-red-500";
  }

  return (
    <Card
      title="Customer Insights Pro"
      action={
        <Badge
          text={`Health ${healthScore}%`}
          color={
            healthScore >= 85
              ? "bg-green-500/15 text-green-300"
              : healthScore >= 70
              ? "bg-yellow-500/15 text-yellow-300"
              : "bg-red-500/15 text-red-300"
          }
        />
      }
    >
      <div className="mb-5 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#FF7A00]">
              Customer Health Score
            </p>
            <h3 className="mt-2 text-4xl font-black">{healthScore}%</h3>
            <p className="mt-2 text-sm text-white/55">
              قياس ولاء الزبائن حسب الرجوع، الرضا، تكرار الطلب، ومخاطر التوقف.
            </p>
          </div>

          <div className="w-full lg:w-72">
            <div className="h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className={`h-full rounded-full ${healthColor(healthScore)}`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-white/45">
              {healthScore >= 85
                ? "العملاء بصحة ممتازة"
                : healthScore >= 70
                ? "جيد ويحتاج متابعة بسيطة"
                : "توجد مخاطر توقف تحتاج تدخل"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Total Customers" value={totalCustomers} color="text-white" />
        <MiniStat title="Active Customers" value={activeCustomers} color="text-green-300" />
        <MiniStat title="Returning Customers" value={returningCustomers} color="text-[#FF7A00]" />
        <MiniStat title="New Customers" value={newCustomers} color="text-yellow-300" />
        <MiniStat title="Avg Basket Size" value={`${avgBasket.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Retention Rate" value={`${retentionRate}%`} color="text-green-300" />
        <MiniStat title="Satisfaction" value={`${satisfaction}%`} color="text-white" />
        <MiniStat title="Churn Risk" value={churnRisk.length} color="text-red-300" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-black">Customer Segments</h3>
              <p className="mt-1 text-xs text-white/45">
                VIP / Frequent / Normal / At Risk
              </p>
            </div>

            <select
              value={selectedSegment}
              onChange={(event) =>
                setSelectedSegment(event.target.value as "الكل" | Customer["segment"])
              }
              className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
            >
              {["الكل", "VIP", "Frequent", "Normal", "At Risk"].map((segment) => (
                <option key={segment}>{segment}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {segmentCounts.map((segment) => (
              <div key={segment.label} className="rounded-2xl bg-black/40 p-4">
                <p className="text-xs text-white/45">{segment.label}</p>
                <p className={`mt-2 text-2xl font-black ${segment.color}`}>
                  {segment.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">New vs Returning Customers</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/40 p-4">
              <p className="text-xs text-white/45">جدد</p>
              <p className="mt-2 text-3xl font-black text-yellow-300">
                {newCustomers}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: `${(newCustomers / Math.max(1, totalCustomers)) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-black/40 p-4">
              <p className="text-xs text-white/45">راجعين</p>
              <p className="mt-2 text-3xl font-black text-green-300">
                {returningCustomers}
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${retentionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4 text-sm text-white/70">
            🧠 AI: نسبة الرجوع {retentionRate}%. أفضل خطوة الآن هي عرض مخصص
            للزبائن المتوقفين من أكثر من أسبوع.
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Top Customers Leaderboard</h3>
          <div className="mt-4 space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">
                      #{index + 1} {customer.name}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      {customer.area} — آخر طلب: {customer.lastOrder}
                    </p>
                  </div>
                  <Badge text={customer.segment} color={segmentBadge(customer.segment)} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-white/35">طلبات</p>
                    <p className="mt-1 font-black text-[#FF7A00]">
                      {customer.orders}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-white/35">إنفاق</p>
                    <p className="mt-1 font-black">
                      {customer.totalSpend.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/5 p-3">
                    <p className="text-white/35">رضا</p>
                    <p className="mt-1 font-black text-green-300">
                      {customer.satisfaction}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Peak Ordering Hours</h3>
          <div className="mt-4 grid grid-cols-7 gap-2">
            {peakHours.map((hour) => (
              <div key={hour.label} className="rounded-2xl bg-black/40 p-2 text-center">
                <div className="flex h-32 items-end">
                  <div
                    className="w-full rounded-xl bg-[#FF7A00]"
                    style={{ height: `${hour.value}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-white/45">{hour.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <h3 className="font-black">Most Ordered Categories</h3>
            <div className="mt-4 space-y-3">
              {categoryDemand.map((category) => (
                <div key={category.category}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span>{category.category}</span>
                    <span className="text-white/45">{category.orders} طلب</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#FF7A00]"
                      style={{
                        width: `${(category.orders / maxCategoryOrders) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {churnRisk.length > 0 && (
        <div className="mb-5 rounded-3xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black text-red-200">Churn Risk Alerts</p>
              <p className="mt-1 text-sm text-white/55">
                يوجد {churnRisk.length} زبائن معرضين للتوقف. يحتاجون عرض رجوع أو
                رسالة متابعة.
              </p>
            </div>
            <Badge text="تدخل مطلوب" color="bg-red-500/15 text-red-300" />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {churnRisk.map((customer) => (
              <div key={customer.id} className="rounded-2xl bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{customer.name}</p>
                    <p className="mt-1 text-xs text-white/45">
                      آخر طلب: {customer.lastOrder} — رضا {customer.satisfaction}%
                    </p>
                  </div>
                  <Badge text={customer.segment} color={segmentBadge(customer.segment)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {aiRecommendations.map((item) => (
          <div key={item.title} className={`rounded-3xl border p-4 ${item.color}`}>
            <p className="font-black text-white">{item.title}</p>
            <p className="mt-2 text-sm text-white/65">{item.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ForecastCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;

  const expectedOrders = Math.max(
    34,
    Math.round(orders.length * 9.4 + activeOrders * 3 + urgentOrders * 4)
  );
  const averageOrder = orders.length ? Math.round(totalSales / orders.length) : 0;
  const expectedRevenue = Math.round(expectedOrders * Math.max(averageOrder, 14500) * 1.08);
  const growthRate = Math.max(
    6,
    Math.min(42, Math.round((expectedOrders / Math.max(orders.length * 7, 1)) * 100 - 55))
  );
  const demandScore = Math.max(
    58,
    Math.min(97, 72 + activeOrders * 4 + urgentOrders * 5 - outOfStock * 3 - highAlerts * 2)
  );
  const aiConfidence = Math.max(
    71,
    Math.min(96, 88 - highAlerts * 3 - outOfStock * 2 + deliveredOrders * 2)
  );

  const peakHours = [
    { time: "8-10 ص", orders: 38, revenue: 620000, level: "فطور قوي" },
    { time: "12-2 م", orders: 52, revenue: 910000, level: "ذروة غداء" },
    { time: "5-7 م", orders: 44, revenue: 780000, level: "نشاط متوسط" },
    { time: "8-10 م", orders: 61, revenue: 1180000, level: "أعلى ذروة" },
  ];

  const demandAreas = [
    { area: "زيونة", demand: 94, expected: 42 },
    { area: "الكرادة", demand: 86, expected: 35 },
    { area: "المنصور", demand: 74, expected: 28 },
    { area: "الجادرية", demand: 68, expected: 24 },
    { area: "العرصات", demand: 55, expected: 18 },
    { area: "اليرموك", demand: 49, expected: 15 },
  ];

  const busyDays = [
    { day: "السبت", value: 66 },
    { day: "الأحد", value: 72 },
    { day: "الاثنين", value: 64 },
    { day: "الثلاثاء", value: 76 },
    { day: "الأربعاء", value: 81 },
    { day: "الخميس", value: 93 },
    { day: "الجمعة", value: 98 },
  ];

  const productForecast = [...menu]
    .map((item) => {
      const boost = item.discount > 0 ? 1.18 : 1;
      const stockPenalty = item.outOfStock ? 0.35 : 1;
      const expected = Math.max(3, Math.round(item.ordersToday * boost * stockPenalty + demandScore / 12));
      const risk = item.outOfStock ? "متوقف بسبب النفاد" : expected >= 35 ? "طلب عالي" : expected >= 22 ? "طلب جيد" : "يحتاج عرض";
      return { ...item, expected, risk };
    })
    .sort((a, b) => b.expected - a.expected);

  const riskAlerts = [
    outOfStock > 0
      ? `يوجد ${outOfStock} صنف نافد وقد يخفض الطلب المتوقع.`
      : "توفر المنيو جيد ولا يوجد أثر كبير على الطلب.",
    urgentOrders > 0
      ? `الطلبات العاجلة (${urgentOrders}) تشير إلى ضغط تشغيلي قريب.`
      : "لا توجد طلبات عاجلة تضغط التوقعات حالياً.",
    highAlerts > 0
      ? `عندك ${highAlerts} تنبيه عالي، الأفضل حله قبل الذروة.`
      : "التنبيهات العالية تحت السيطرة.",
  ];

  function forecastBadge(value: number) {
    if (value >= 85) return "bg-green-500/15 text-green-300";
    if (value >= 70) return "bg-yellow-500/15 text-yellow-300";
    return "bg-red-500/15 text-red-300";
  }

  function barColor(value: number) {
    if (value >= 85) return "bg-green-500";
    if (value >= 70) return "bg-[#FF7A00]";
    return "bg-yellow-500";
  }

  return (
    <Card
      title="Forecast Center Pro"
      action={
        <Badge
          text={`AI Confidence ${aiConfidence}%`}
          color={forecastBadge(aiConfidence)}
        />
      }
    >
      <div className="mb-5 rounded-3xl border border-[#FF7A00]/20 bg-gradient-to-l from-[#FF7A00]/15 to-white/5 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-[#FF7A00]">AI Revenue Prediction</p>
            <h3 className="mt-2 text-3xl font-black">
              {expectedRevenue.toLocaleString()} د.ع
            </h3>
            <p className="mt-2 text-sm text-white/55">
              توقع الإيراد القادم حسب الطلبات الحالية، متوسط السلة، ضغط المطبخ، وتوفر المنيو.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-3 lg:w-[420px]">
            <MiniStat title="Expected Orders" value={expectedOrders} color="text-white" />
            <MiniStat title="Growth" value={`${growthRate}%`} color="text-green-300" />
          </div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-6">
        <MiniStat title="طلبات متوقعة" value={expectedOrders} color="text-[#FF7A00]" />
        <MiniStat title="إيراد متوقع" value={`${expectedRevenue.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="Peak Time" value="8-10 م" color="text-yellow-300" />
        <MiniStat title="Demand Score" value={`${demandScore}%`} color="text-white" />
        <MiniStat title="AI Confidence" value={`${aiConfidence}%`} color="text-sky-300" />
        <MiniStat title="Risk Alerts" value={riskAlerts.length} color="text-red-300" />
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black">Orders Forecast & Peak Hours</h3>
            <Badge text="Next 12 Hours" color="bg-[#FF7A00]/15 text-[#FF7A00]" />
          </div>

          <div className="mt-4 space-y-3">
            {peakHours.map((slot) => (
              <div key={slot.time} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{slot.time}</p>
                    <p className="text-xs text-white/45">{slot.level}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-[#FF7A00]">{slot.orders} طلب</p>
                    <p className="text-xs text-white/45">{slot.revenue.toLocaleString()} د.ع</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${barColor(slot.orders + 25)}`}
                    style={{ width: `${Math.min(100, slot.orders + 25)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black">Demand Heatmap Forecast</h3>
            <Badge text={`${demandScore}%`} color={forecastBadge(demandScore)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {demandAreas.map((area) => (
              <div key={area.area} className="rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-black">{area.area}</p>
                  <span className="text-xs text-white/45">{area.expected} طلب</span>
                </div>
                <p className="mt-2 text-3xl font-black text-[#FF7A00]">{area.demand}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40">
                  <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${area.demand}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Busy Days Analysis</h3>

          <div className="mt-4 grid grid-cols-7 gap-2">
            {busyDays.map((day) => (
              <div key={day.day} className="rounded-2xl bg-black/40 p-2 text-center">
                <div className="flex h-32 items-end">
                  <div
                    className="w-full rounded-xl bg-[#FF7A00]"
                    style={{ height: `${day.value}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-white/45">{day.day}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4 text-sm text-white/70">
            🧠 التوقع: الخميس والجمعة أعلى ضغط. حضّر مواد الفطور والمعجنات قبل الذروة.
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black">Products Demand Forecast</h3>
            <Badge text="Menu AI" color="bg-green-500/15 text-green-300" />
          </div>

          <div className="mt-4 space-y-3">
            {productForecast.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="text-xs text-white/45">
                      اليوم {item.ordersToday} — المتوقع {item.expected} طلب
                    </p>
                  </div>
                  <Badge
                    text={item.risk}
                    color={
                      item.risk === "طلب عالي"
                        ? "bg-green-500/15 text-green-300"
                        : item.risk === "طلب جيد"
                        ? "bg-[#FF7A00]/15 text-[#FF7A00]"
                        : item.risk === "متوقف بسبب النفاد"
                        ? "bg-red-500/15 text-red-300"
                        : "bg-yellow-500/15 text-yellow-300"
                    }
                  />
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#FF7A00]"
                    style={{ width: `${Math.min(100, item.expected * 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Inventory Forecast Integration</h3>
          <div className="mt-4 space-y-3">
            {menu.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{item.name}</p>
                    <p className="mt-1 text-xs text-white/45">
                      {item.outOfStock
                        ? "خطر: الصنف نافد وقد يخسر طلبات متوقعة."
                        : "المخزون الظاهر يسمح باستقبال الطلبات."}
                    </p>
                  </div>
                  <Badge
                    text={item.outOfStock ? "Restock Now" : "Ready"}
                    color={item.outOfStock ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-black">Weather Impact & Risk Alerts</h3>

          <div className="mt-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
            <p className="font-black text-sky-200">Weather Impact Forecast</p>
            <p className="mt-2 text-sm text-white/65">
              إذا الجو حار أو ممطر، الطلبات المنزلية ترتفع خصوصاً بالمناطق السكنية.
              النظام يقترح زيادة جاهزية السائقين وقت المساء.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {riskAlerts.map((risk) => (
              <div key={risk} className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
                {risk}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}


function SmartInventoryCenter({ menu }: { menu: MenuItem[] }) {
  return (
    <Card title="Smart Inventory Center">
      <MiniStat
        title="أصناف تحتاج تجهيز"
        value={menu.filter((item) => item.outOfStock).length}
        color="text-red-300"
      />
    </Card>
  );
}

function FuseCopilotCenter() {
  return (
    <Card title="Fuse Copilot Center">
      <div className="rounded-2xl bg-black p-4 text-sm text-white/70">
        اسأل: شنو أكثر صنف مبيع؟ شنو الطلب المتأخر؟ شنو أفضل عرض اليوم؟
      </div>
    </Card>
  );
}

function RestaurantSettingsCenter({
  settings,
  setSettings,
}: {
  settings: Settings;
  setSettings: (settings: Settings) => void;
}) {
  const isBusy = settings.mode === "مشغول";
  const isClosed = settings.mode === "مغلق";
  const operationLabel = isClosed
    ? "استقبال الطلبات متوقف"
    : isBusy
    ? "استقبال محدود بسبب الضغط"
    : "استقبال الطلبات طبيعي";

  const settingRows = [
    {
      title: "وقت الفتح",
      value: settings.openTime,
      hint: "بداية استقبال الطلبات",
    },
    {
      title: "وقت الإغلاق",
      value: settings.closeTime,
      hint: "إيقاف استقبال الطلبات",
    },
    {
      title: "الحد الأدنى",
      value: `${settings.minOrder.toLocaleString()} د.ع`,
      hint: "أقل قيمة طلب مقبولة",
    },
    {
      title: "رسوم التوصيل",
      value: `${settings.deliveryFee.toLocaleString()} د.ع`,
      hint: "رسوم الفرع الحالية",
    },
    {
      title: "وقت التحضير",
      value: `${settings.prepTime} د`,
      hint: "الهدف التشغيلي للمطبخ",
    },
    {
      title: "حالة التشغيل",
      value: settings.mode,
      hint: operationLabel,
    },
  ];

  return (
    <Card
      title="Restaurant Settings Pro"
      action={
        <Badge
          text={settings.mode}
          color={
            settings.mode === "مفتوح"
              ? "bg-green-500/15 text-green-300"
              : settings.mode === "مشغول"
              ? "bg-yellow-500/15 text-yellow-300"
              : "bg-red-500/15 text-red-300"
          }
        />
      }
    >
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-xs text-white/45">Vendor Operating Mode</p>
        <h3 className="mt-1 text-xl font-black text-white">{operationLabel}</h3>
        <p className="mt-2 text-sm text-white/60">
          عدّل أوقات العمل، أقل طلب، رسوم التوصيل ووقت التحضير من مكان واحد مثل لوحة المطعم الاحترافية.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {settingRows.map((row) => (
          <div key={row.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/40">{row.title}</p>
            <p className="mt-1 text-lg font-black text-white">{row.value}</p>
            <p className="mt-1 text-xs text-white/35">{row.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="space-y-2">
          <span className="text-xs font-bold text-white/45">وقت الفتح</span>
          <input
            value={settings.openTime}
            onChange={(event) =>
              setSettings({ ...settings, openTime: event.target.value })
            }
            className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#FF7A00]/50"
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-bold text-white/45">وقت الإغلاق</span>
          <input
            value={settings.closeTime}
            onChange={(event) =>
              setSettings({ ...settings, closeTime: event.target.value })
            }
            className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#FF7A00]/50"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-xs font-bold text-white/45">الحد الأدنى للطلب</span>
            <input
              type="number"
              value={settings.minOrder}
              onChange={(event) =>
                setSettings({ ...settings, minOrder: Number(event.target.value) })
              }
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#FF7A00]/50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold text-white/45">رسوم التوصيل</span>
            <input
              type="number"
              value={settings.deliveryFee}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  deliveryFee: Number(event.target.value),
                })
              }
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#FF7A00]/50"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-bold text-white/45">وقت التحضير بالدقائق</span>
            <input
              type="number"
              value={settings.prepTime}
              onChange={(event) =>
                setSettings({ ...settings, prepTime: Number(event.target.value) })
              }
              className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm outline-none focus:border-[#FF7A00]/50"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["مفتوح", "مشغول", "مغلق"] as Settings["mode"][]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSettings({ ...settings, mode })}
              className={`rounded-2xl px-4 py-3 text-sm font-black ${
                settings.mode === mode
                  ? mode === "مفتوح"
                    ? "bg-green-500 text-black"
                    : mode === "مشغول"
                    ? "bg-yellow-400 text-black"
                    : "bg-red-500 text-white"
                  : "bg-white/10 text-white/55"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}


function AIInsightsBanner({
  orders,
  menu,
  alerts,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  settings: Settings;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;

  const insight =
    urgentOrders > 0
      ? `يوجد ${urgentOrders} طلب عاجل. الأفضل رفع أولوية المطبخ والتغليف الآن.`
      : outOfStock > 0
      ? `يوجد ${outOfStock} صنف نافد. اخفِ الأصناف النافدة حتى لا تزيد الإلغاءات.`
      : highAlerts > 0
      ? `يوجد ${highAlerts} تنبيه عالي. عالجه قبل ساعة الذروة.`
      : `التشغيل مستقر. حافظ على هدف التحضير ${settings.prepTime} دقيقة.`;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#FF7A00]/20 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.22),transparent_35%),#0B0B0B] p-5 shadow-[0_0_45px_rgba(255,122,0,0.08)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#FF7A00]">
            FUSE AI INSIGHTS
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">AI Insights Banner</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/65">{insight}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:min-w-[520px]">
          <MiniStat title="نشطة" value={activeOrders} color="text-yellow-300" />
          <MiniStat title="عاجلة" value={urgentOrders} color="text-red-300" />
          <MiniStat title="نافدة" value={outOfStock} color="text-[#FF7A00]" />
          <MiniStat title="حرجة" value={highAlerts} color="text-white" />
        </div>
      </div>
    </section>
  );
}

function ExecutiveSummaryBar({
  orders,
  totalSales,
  menu,
  alerts,
  restaurantOpen,
  settings,
}: {
  orders: Order[];
  totalSales: number;
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  restaurantOpen: boolean;
  settings: Settings;
}) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const completionRate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const unresolved = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const health = Math.max(40, 100 - outOfStock * 8 - unresolved * 7 + completionRate / 5);

  return (
    <section className="rounded-3xl border border-white/10 bg-[#0B0B0B] p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        <MiniStat title="Executive Score" value={`${Math.round(health)}%`} color="text-[#FF7A00]" />
        <MiniStat title="حالة المطعم" value={restaurantOpen ? settings.mode : "مغلق"} color={restaurantOpen ? "text-green-300" : "text-red-300"} />
        <MiniStat title="إيراد مباشر" value={`${totalSales.toLocaleString()} د.ع`} color="text-white" />
        <MiniStat title="نسبة الإنجاز" value={`${completionRate}%`} color="text-green-300" />
        <MiniStat title="تنبيهات مفتوحة" value={unresolved} color="text-yellow-300" />
      </div>
    </section>
  );
}

function SmartNotificationsCenter({
  orders,
  alerts,
  menu,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
  menu: MenuItem[];
}) {
  const notifications = [
    ...orders.slice(0, 4).map((order) => ({
      id: `order-${order.id}`,
      title: `طلب ${order.id}`,
      body: `${order.customer} — ${order.status} — ${order.amount.toLocaleString()} د.ع`,
      type: "Orders",
      tone: order.priority === "عاجل" ? "bg-red-500/15 text-red-300" : "bg-[#FF7A00]/15 text-[#FF7A00]",
      time: order.time,
    })),
    ...alerts.slice(0, 3).map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      body: alert.message,
      type: alert.type,
      tone: alert.level === "عالي" ? "bg-red-500/15 text-red-300" : "bg-yellow-500/15 text-yellow-300",
      time: alert.time,
    })),
    ...menu
      .filter((item) => item.outOfStock)
      .map((item) => ({
        id: `stock-${item.id}`,
        title: "مخزون نافد",
        body: `${item.name} يحتاج إخفاء أو إعادة تجهيز.`,
        type: "Inventory",
        tone: "bg-purple-500/15 text-purple-300",
        time: "الآن",
      })),
  ].slice(0, 8);

  return (
    <Card
      title="Smart Notifications Center"
      action={<Badge text="Live" color="bg-green-500/15 text-green-300" />}
    >
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{item.body}</p>
              </div>
              <Badge text={item.type} color={item.tone} />
            </div>
            <p className="mt-2 text-xs text-white/35">{item.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ActivityTimelinePro({
  orders,
  alerts,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const events = [
    ...orders.map((order) => ({
      id: `timeline-${order.id}`,
      title: `${order.id} — ${order.customer}`,
      text: `الحالة: ${order.status} / السائق: ${order.driver} / المنطقة: ${order.area}`,
      time: order.time,
      tone: order.priority === "عاجل" ? "border-red-500/30 bg-red-500/10" : "border-[#FF7A00]/30 bg-[#FF7A00]/10",
    })),
    ...alerts.map((alert) => ({
      id: `timeline-alert-${alert.id}`,
      title: alert.title,
      text: alert.message,
      time: alert.time,
      tone: alert.level === "عالي" ? "border-red-500/30 bg-red-500/10" : "border-yellow-500/30 bg-yellow-500/10",
    })),
  ].slice(0, 10);

  return (
    <Card title="Activity Timeline Pro">
      <div className="relative space-y-3 before:absolute before:right-4 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-white/10">
        {events.map((event) => (
          <div key={event.id} className="relative pr-10">
            <div className={`absolute right-0 top-3 h-8 w-8 rounded-full border ${event.tone} flex items-center justify-center text-xs font-black text-white`}>
              ●
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{event.title}</p>
                  <p className="mt-1 text-sm text-white/55">{event.text}</p>
                </div>
                <span className="text-xs text-white/35">{event.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdvancedChartsAreaPro({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const orderBars = ORDER_STATUSES.map((status) => ({
    label: status,
    value: orders.filter((order) => order.status === status).length,
  }));
  const maxOrders = Math.max(1, ...orderBars.map((bar) => bar.value));
  const menuMax = Math.max(1, ...menu.map((item) => item.ordersToday));

  return (
    <Card title="Advanced Charts Area Pro">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-4 font-black">Orders Distribution</p>
          <div className="space-y-3">
            {orderBars.map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex justify-between text-xs text-white/45">
                  <span>{bar.label}</span>
                  <span>{bar.value}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-black">
                  <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${(bar.value / maxOrders) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="mb-4 font-black">Top Menu Demand</p>
          <div className="grid h-44 grid-cols-4 items-end gap-3">
            {menu.map((item) => (
              <div key={item.id} className="flex h-full flex-col justify-end gap-2 text-center">
                <div className="mx-auto w-full rounded-2xl bg-[#FF7A00]" style={{ height: `${Math.max(12, (item.ordersToday / menuMax) * 100)}%` }} />
                <p className="truncate text-xs text-white/45">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="تنبيهات" value={alerts.length} color="text-yellow-300" />
        <MiniStat title="أعلى صنف" value={[...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0]?.name || "-"} color="text-[#FF7A00]" />
        <MiniStat title="طلبات اليوم" value={orders.length} color="text-white" />
      </div>
    </Card>
  );
}

function RevenueTrendsPanel({ orders }: { orders: Order[] }) {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const days = [
    { day: "السبت", value: Math.round(total * 0.72) },
    { day: "الأحد", value: Math.round(total * 0.84) },
    { day: "الاثنين", value: total },
    { day: "الثلاثاء", value: Math.round(total * 1.12) },
    { day: "الأربعاء", value: Math.round(total * 1.05) },
    { day: "الخميس", value: Math.round(total * 1.22) },
    { day: "الجمعة", value: Math.round(total * 1.34) },
  ];
  const max = Math.max(...days.map((day) => day.value), 1);
  const growth = days[0].value ? Math.round(((days[days.length - 1].value - days[0].value) / days[0].value) * 100) : 0;

  return (
    <Card title="Revenue Trends Panel">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="نمو أسبوعي" value={`${growth}%`} color="text-green-300" />
        <MiniStat title="قمة متوقعة" value={`${days[days.length - 1].value.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="متوسط يومي" value={`${Math.round(days.reduce((s, d) => s + d.value, 0) / days.length).toLocaleString()} د.ع`} color="text-white" />
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div key={day.day} className="rounded-2xl bg-white/5 p-2 text-center">
            <div className="flex h-36 items-end">
              <div className="w-full rounded-xl bg-[#FF7A00]" style={{ height: `${Math.max(10, (day.value / max) * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/45">{day.day}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrdersTimelineBoard({ orders }: { orders: Order[] }) {
  return (
    <Card title="Orders Timeline Board">
      <div className="space-y-4">
        {orders.map((order) => {
          const index = ORDER_STATUSES.indexOf(order.status);
          const progress = index >= 0 ? Math.round(((index + 1) / ORDER_STATUSES.length) * 100) : 0;
          return (
            <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{order.id} — {order.customer}</p>
                  <p className="mt-1 text-xs text-white/45">{order.area} / {order.time}</p>
                </div>
                <Badge text={order.status} color={statusAccent(order.status)} />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px] text-white/35">
                {ORDER_STATUSES.map((status) => (
                  <span key={`${order.id}-${status}`} className={ORDER_STATUSES.indexOf(status) <= index ? "text-[#FF7A00]" : ""}>
                    {status}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function LiveSystemStatusMonitor({
  orders,
  menu,
  alerts,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  restaurantOpen: boolean;
}) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const systems = [
    { name: "Orders API", value: activeOrders >= 4 ? 82 : 96, status: activeOrders >= 4 ? "ضغط" : "مستقر" },
    { name: "Kitchen Flow", value: alerts.some((alert) => alert.type === "مطبخ") ? 78 : 94, status: "مراقبة" },
    { name: "Menu Sync", value: menu.some((item) => item.outOfStock) ? 74 : 98, status: "Live" },
    { name: "Dispatch AI", value: drivers.filter((driver) => driver.online).length >= 2 ? 95 : 70, status: "Auto" },
    { name: "Restaurant Mode", value: restaurantOpen ? 100 : 20, status: restaurantOpen ? "Online" : "Closed" },
  ];

  return (
    <Card title="Live System Status Monitor">
      <div className="space-y-3">
        {systems.map((system) => (
          <div key={system.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-black">{system.name}</p>
              <span className="text-xs text-white/45">{system.status}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black">
              <div className={`h-full rounded-full ${system.value >= 90 ? "bg-green-500" : system.value >= 75 ? "bg-[#FF7A00]" : "bg-red-500"}`} style={{ width: `${system.value}%` }} />
            </div>
            <p className="mt-2 text-left text-xs text-white/45">{system.value}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ModernTablesPro({
  orders,
  menu,
}: {
  orders: Order[];
  menu: MenuItem[];
}) {
  return (
    <Card title="Modern Tables Pro">
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="grid grid-cols-5 bg-white/5 p-3 text-xs font-black text-white/45">
          <span>الطلب</span>
          <span>الزبون</span>
          <span>الحالة</span>
          <span>القيمة</span>
          <span>السائق</span>
        </div>
        {orders.map((order) => (
          <div key={order.id} className="grid grid-cols-5 border-t border-white/10 p-3 text-xs text-white/65">
            <span className="font-black text-white">{order.id}</span>
            <span>{order.customer}</span>
            <span>{order.status}</span>
            <span className="text-[#FF7A00]">{order.amount.toLocaleString()}</span>
            <span>{order.driver}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
        <div className="grid grid-cols-4 bg-white/5 p-3 text-xs font-black text-white/45">
          <span>الصنف</span>
          <span>القسم</span>
          <span>السعر</span>
          <span>اليوم</span>
        </div>
        {menu.map((item) => (
          <div key={item.id} className="grid grid-cols-4 border-t border-white/10 p-3 text-xs text-white/65">
            <span className="font-black text-white">{item.name}</span>
            <span>{item.category}</span>
            <span className="text-[#FF7A00]">{item.price.toLocaleString()}</span>
            <span>{item.ordersToday}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SmartAlertsTimeline({
  alerts,
  orders,
  menu,
}: {
  alerts: RestaurantAlert[];
  orders: Order[];
  menu: MenuItem[];
}) {
  const timeline = [
    ...alerts.map((alert) => ({
      id: `smart-alert-${alert.id}`,
      title: alert.title,
      text: alert.message,
      level: alert.level,
      time: alert.time,
    })),
    ...orders
      .filter((order) => order.priority === "عاجل")
      .map((order) => ({
        id: `smart-order-${order.id}`,
        title: `طلب عاجل ${order.id}`,
        text: `${order.customer} يحتاج تسريع التنفيذ في ${order.area}.`,
        level: "عالي" as RestaurantAlert["level"],
        time: order.time,
      })),
    ...menu
      .filter((item) => item.outOfStock)
      .map((item) => ({
        id: `smart-menu-${item.id}`,
        title: `نفاد ${item.name}`,
        text: "النظام يقترح إخفاء الصنف مؤقتاً من المنيو.",
        level: "متوسط" as RestaurantAlert["level"],
        time: "الآن",
      })),
  ];

  return (
    <Card title="Smart Alerts Timeline">
      <div className="space-y-3">
        {timeline.slice(0, 7).map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm text-white/55">{item.text}</p>
              </div>
              <Badge
                text={item.level}
                color={item.level === "عالي" ? "bg-red-500/15 text-red-300" : "bg-yellow-500/15 text-yellow-300"}
              />
            </div>
            <p className="mt-2 text-xs text-white/35">{item.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RealTimePerformanceWidgets({
  orders,
  menu,
  alerts,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  settings: Settings;
}) {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const active = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const kitchenLoad = Math.min(100, active * 18 + alerts.filter((alert) => alert.type === "مطبخ").length * 12);
  const menuHealth = Math.max(20, 100 - menu.filter((item) => item.outOfStock).length * 20);

  return (
    <Card title="Real-Time Performance Widgets">
      <div className="grid grid-cols-1 gap-3">
        <MiniStat title="Run Rate" value={`${Math.round(total / Math.max(1, orders.length)).toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Kitchen Load" value={`${kitchenLoad}%`} color={kitchenLoad > 70 ? "text-red-300" : "text-green-300"} />
        <MiniStat title="Menu Health" value={`${menuHealth}%`} color={menuHealth < 75 ? "text-yellow-300" : "text-green-300"} />
        <MiniStat title="Prep Target" value={`${settings.prepTime} د`} color="text-white" />
      </div>
    </Card>
  );
}

function AIAssistantFloatingWidget({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;

  return (
    <div className="fixed bottom-5 left-5 z-40 w-[320px] max-w-[calc(100vw-40px)] rounded-3xl border border-[#FF7A00]/30 bg-[#0B0B0B]/95 p-4 shadow-[0_0_45px_rgba(255,122,0,0.18)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF7A00] text-lg font-black text-black">
          AI
        </div>
        <div>
          <p className="font-black">Fuse Copilot</p>
          <p className="mt-1 text-xs leading-5 text-white/55">
            {urgentOrders > 0
              ? `ابدأ بـ ${urgentOrders} طلب عاجل الآن.`
              : outOfStock > 0
              ? `راجع ${outOfStock} صنف نافد بالمنيو.`
              : highAlerts > 0
              ? `عالج ${highAlerts} تنبيه عالي.`
              : "كلشي مستقر، استمر بنفس الإيقاع."}
          </p>
        </div>
      </div>
      <button className="mt-3 w-full rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-black text-black">
        فتح مساعد FUSE
      </button>
    </div>
  );
}


function MultiBranchCenter({
  branches,
  orders,
}: {
  branches: Branch[];
  orders: Order[];
}) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const totalBranchOrders = branches.reduce((sum, branch) => sum + branch.orders, 0);
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const bestBranch = [...branches].sort((a, b) => b.sales - a.sales)[0];

  return (
    <Card
      title="Multi Branch Center"
      action={<Badge text="Enterprise" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="مبيعات الفروع" value={`${totalBranchSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="طلبات الفروع" value={totalBranchOrders} color="text-white" />
        <MiniStat title="طلبات مباشرة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="أفضل فرع" value={bestBranch?.name || "لا يوجد"} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {branches.map((branch) => {
          const share = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;
          const healthColor =
            branch.status === "ممتاز"
              ? "text-green-300"
              : branch.status === "جيد"
              ? "text-yellow-300"
              : "text-red-300";

          return (
            <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">{branch.area} — ⭐ {branch.rating}</p>
                </div>
                <Badge
                  text={branch.status}
                  color={
                    branch.status === "ممتاز"
                      ? "bg-green-500/15 text-green-300"
                      : branch.status === "جيد"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-red-500/15 text-red-300"
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">المبيعات</p>
                  <p className="mt-1 font-black text-[#FF7A00]">{branch.sales.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الطلبات</p>
                  <p className="mt-1 font-black text-white">{branch.orders}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الحصة</p>
                  <p className={`mt-1 font-black ${healthColor}`}>{share}%</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function FranchiseCenter({
  branches,
  totalSales,
}: {
  branches: Branch[];
  totalSales: number;
}) {
  const franchisePartners = [
    { name: "FUSE Partner - بغداد", region: "الرصافة", branches: 3, royalty: 7, status: "فعال" },
    { name: "FUSE Partner - الكرخ", region: "الكرخ", branches: 2, royalty: 6, status: "قيد التوسع" },
    { name: "FUSE Partner - المحافظات", region: "بصرة / أربيل", branches: 1, royalty: 5, status: "تجريبي" },
  ];

  const expectedRoyalty = Math.round((totalSales + branches.reduce((sum, branch) => sum + branch.sales, 0)) * 0.06);

  return (
    <Card
      title="Franchise Center"
      action={<Badge text="Partner Network" color="bg-purple-500/15 text-purple-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="شركاء الامتياز" value={franchisePartners.length} color="text-purple-300" />
        <MiniStat title="فروع مرخصة" value={franchisePartners.reduce((sum, item) => sum + item.branches, 0)} color="text-[#FF7A00]" />
        <MiniStat title="Royalty متوقع" value={`${expectedRoyalty.toLocaleString()} د.ع`} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {franchisePartners.map((partner) => (
          <div key={partner.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{partner.name}</p>
                <p className="mt-1 text-xs text-white/45">{partner.region} — {partner.branches} فروع</p>
              </div>
              <Badge
                text={partner.status}
                color={partner.status === "فعال" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
              />
            </div>
            <div className="mt-4 rounded-2xl bg-black p-3 text-sm text-white/65">
              نسبة الامتياز: <span className="font-black text-[#FF7A00]">{partner.royalty}%</span> — توصية: راقب جودة التشغيل قبل فتح فرع جديد.
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CRMPro({
  customers,
  orders,
}: {
  customers: Customer[];
  orders: Order[];
}) {
  const vipCustomers = customers.filter((customer) => customer.segment === "VIP").length;
  const atRiskCustomers = customers.filter((customer) => customer.segment === "At Risk").length;
  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const averageSatisfaction = customers.length
    ? Math.round(customers.reduce((sum, customer) => sum + customer.satisfaction, 0) / customers.length)
    : 0;

  return (
    <Card
      title="CRM Pro"
      action={<Badge text="Customer OS" color="bg-sky-500/15 text-sky-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="العملاء" value={customers.length} color="text-white" />
        <MiniStat title="VIP" value={vipCustomers} color="text-[#FF7A00]" />
        <MiniStat title="At Risk" value={atRiskCustomers} color="text-red-300" />
        <MiniStat title="رضا عام" value={`${averageSatisfaction}%`} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {customers.slice(0, 5).map((customer) => {
          const lastOrder = orders.find((order) => order.customer === customer.name);
          return (
            <div key={customer.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{customer.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {customer.area} — {customer.orders} طلب — آخر طلب: {customer.lastOrder}
                  </p>
                </div>
                <Badge
                  text={customer.segment}
                  color={
                    customer.segment === "VIP"
                      ? "bg-[#FF7A00]/15 text-[#FF7A00]"
                      : customer.segment === "At Risk"
                      ? "bg-red-500/15 text-red-300"
                      : "bg-white/10 text-white/55"
                  }
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الصرف</p>
                  <p className="mt-1 font-black text-[#FF7A00]">{customer.totalSpend.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الرضا</p>
                  <p className="mt-1 font-black text-green-300">{customer.satisfaction}%</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">آخر طلب</p>
                  <p className="mt-1 font-black text-white">{lastOrder?.id || "-"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🧠 CRM Insight: إجمالي صرف العملاء المسجلين {totalSpend.toLocaleString()} د.ع. ركّز على استرجاع شريحة At Risk بعرض خاص.
      </div>
    </Card>
  );
}

function LoyaltySystem({
  customers,
  orders,
}: {
  customers: Customer[];
  orders: Order[];
}) {
  const totalPoints = customers.reduce((sum, customer) => sum + customer.orders * 120, 0);
  const redeemReady = customers.filter((customer) => customer.orders >= 7).length;
  const todayPoints = orders.reduce((sum, order) => sum + Math.round(order.amount / 250), 0);

  return (
    <Card
      title="Loyalty System"
      action={<Badge text="Rewards" color="bg-yellow-500/15 text-yellow-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="نقاط نشطة" value={totalPoints.toLocaleString()} color="text-yellow-300" />
        <MiniStat title="جاهزين للمكافأة" value={redeemReady} color="text-green-300" />
        <MiniStat title="نقاط اليوم" value={todayPoints.toLocaleString()} color="text-[#FF7A00]" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {[
          { title: "كوبون VIP", desc: "خصم 15% للزبائن الأعلى صرفاً", impact: "+18% عودة" },
          { title: "وجبة مجانية", desc: "بعد 10 طلبات مكتملة", impact: "+22% ولاء" },
          { title: "استرجاع عميل", desc: "عرض خاص لشريحة At Risk", impact: "+11% مبيعات" },
        ].map((reward) => (
          <div key={reward.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{reward.title}</p>
            <p className="mt-2 text-sm text-white/55">{reward.desc}</p>
            <p className="mt-3 rounded-2xl bg-black p-3 text-xs font-black text-[#FF7A00]">{reward.impact}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MarketingCenter({
  menu,
  orders,
  alerts,
}: {
  menu: MenuItem[];
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const topItem = [...menu].filter((item) => !item.outOfStock).sort((a, b) => b.ordersToday - a.ordersToday)[0];
  const lowDemand = [...menu].filter((item) => !item.outOfStock).sort((a, b) => a.ordersToday - b.ordersToday)[0];
  const urgentAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const expectedLift = Math.round(orders.reduce((sum, order) => sum + order.amount, 0) * 0.18);

  const campaigns = [
    {
      name: "Boost Hero Item",
      target: topItem?.name || "أفضل صنف",
      channel: "Push + Banner",
      budget: "25,000 د.ع",
      result: `+${expectedLift.toLocaleString()} د.ع`,
    },
    {
      name: "Recover Low Demand",
      target: lowDemand?.name || "صنف منخفض",
      channel: "Coupon",
      budget: "15,000 د.ع",
      result: "+9% طلبات",
    },
    {
      name: "Peak Hour Flash",
      target: "وقت الذروة",
      channel: "In-App Alert",
      budget: "10,000 د.ع",
      result: "+14% سرعة دوران",
    },
  ];

  return (
    <Card
      title="Marketing Center"
      action={<Badge text="Growth" color="bg-pink-500/15 text-pink-300" />}
    >
      {urgentAlerts > 0 && (
        <div className="mb-4 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          ⚠️ لا تطلق حملة كبيرة قبل معالجة {urgentAlerts} تنبيه عالي حتى لا تزيد الضغط على التشغيل.
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{campaign.name}</p>
                <p className="mt-1 text-xs text-white/45">{campaign.target} — {campaign.channel}</p>
              </div>
              <Badge text={campaign.result} color="bg-[#FF7A00]/15 text-[#FF7A00]" />
            </div>
            <p className="mt-3 rounded-2xl bg-black p-3 text-xs text-white/55">ميزانية مقترحة: {campaign.budget}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinanceCenter({
  orders,
  totalSales,
}: {
  orders: Order[];
  totalSales: number;
}) {
  const commission = Math.round(totalSales * 0.12);
  const foodCost = Math.round(totalSales * 0.42);
  const operationCost = Math.round(totalSales * 0.16);
  const driverCost = Math.round(totalSales * 0.08);
  const netProfit = totalSales - commission - foodCost - operationCost - driverCost;
  const profitMargin = totalSales ? Math.round((netProfit / totalSales) * 100) : 0;
  const cashOrders = orders.filter((order) => order.payment === "كاش").reduce((sum, order) => sum + order.amount, 0);
  const digitalOrders = totalSales - cashOrders;

  const rows = [
    { title: "عمولة المنصة", value: commission, color: "text-yellow-300" },
    { title: "كلفة المواد", value: foodCost, color: "text-red-300" },
    { title: "تشغيل وتغليف", value: operationCost, color: "text-white" },
    { title: "كلفة التوصيل", value: driverCost, color: "text-purple-300" },
    { title: "صافي الربح", value: netProfit, color: netProfit >= 0 ? "text-green-300" : "text-red-300" },
  ];

  return (
    <Card
      title="Finance Center"
      action={<Badge text={`${profitMargin}% Margin`} color="bg-green-500/15 text-green-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="إجمالي" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="كاش" value={`${cashOrders.toLocaleString()} د.ع`} color="text-white" />
        <MiniStat title="رقمي" value={`${digitalOrders.toLocaleString()} د.ع`} color="text-sky-300" />
        <MiniStat title="صافي" value={`${netProfit.toLocaleString()} د.ع`} color={netProfit >= 0 ? "text-green-300" : "text-red-300"} />
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const percent = totalSales ? Math.round((row.value / totalSales) * 100) : 0;
          return (
            <div key={row.title} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white/60">{row.title}</span>
                <span className={`font-black ${row.color}`}>{row.value.toLocaleString()} د.ع</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AIBrainUltra({
  orders,
  menu,
  alerts,
  totalSales,
  settings,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
  settings: Settings;
  restaurantOpen: boolean;
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const delayedOrders = orders.filter(
    (order) =>
      ["قيد التحضير", "جاهز", "قيد التوصيل"].includes(order.status) &&
      order.prepMinutes > settings.prepTime
  ).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const completionRate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const brainScore = Math.max(
    35,
    100 - urgentOrders * 12 - delayedOrders * 10 - highAlerts * 9 - outOfStock * 7 + Math.round(completionRate / 8)
  );
  const decision = !restaurantOpen
    ? "المطعم مغلق، راقب الطلبات المجدولة ولا تطلق حملات الآن."
    : brainScore >= 85
    ? "التشغيل ممتاز، فعّل حملة مبيعات خفيفة لزيادة الإيراد بدون ضغط."
    : brainScore >= 70
    ? "التشغيل مستقر، ركّز على تسريع الطلبات الجاهزة وتحديث المنيو."
    : "يوجد ضغط واضح، أوقف العروض مؤقتاً وفعّل دعم المطبخ والتغليف.";

  const signals = [
    { title: "ضغط الطلبات", value: urgentOrders + delayedOrders, label: urgentOrders ? "عاجل" : "مسيطر", color: urgentOrders ? "text-red-300" : "text-green-300" },
    { title: "ذكاء المنيو", value: menu.filter((item) => item.ordersToday >= 20).length, label: "أصناف رابحة", color: "text-[#FF7A00]" },
    { title: "مخاطر النظام", value: highAlerts + outOfStock, label: "تحتاج متابعة", color: highAlerts || outOfStock ? "text-yellow-300" : "text-green-300" },
  ];

  return (
    <Card
      title="AI Brain Ultra"
      action={<Badge text={`${brainScore}% Brain Score`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}
    >
      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm text-white/55">قرار FUSE AI المركزي</p>
        <h3 className="mt-2 text-xl font-black text-white">{decision}</h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/60">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${brainScore}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {signals.map((signal) => (
          <div key={signal.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/45">{signal.title}</p>
            <p className={`mt-2 text-2xl font-black ${signal.color}`}>{signal.value}</p>
            <p className="mt-1 text-xs text-white/40">{signal.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-black p-4 text-sm text-white/65">
        إجمالي اليوم: {totalSales.toLocaleString()} د.ع — AI يراقب الإيراد، الضغط، المنيو والتنبيهات بنفس الوقت.
      </div>
    </Card>
  );
}

function PredictiveAnalytics({
  orders,
  menu,
  alerts,
  totalSales,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
  settings: Settings;
}) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const expectedOrders = orders.length + Math.max(4, activeOrders * 3 + alerts.filter((alert) => alert.level === "عالي").length);
  const expectedSales = totalSales + Math.round(totalSales * 0.32) + activeOrders * 9000;
  const peakRisk = activeOrders >= 4 ? "ضغط عالي" : activeOrders >= 2 ? "ضغط متوسط" : "هادئ";
  const stockRisk = menu.filter((item) => item.outOfStock || item.ordersToday >= 28).length;
  const forecastBars = [55, 68, 82, 76, 91, 72, 64];

  return (
    <Card
      title="Predictive Analytics"
      action={<Badge text="Next 6 Hours" color="bg-purple-500/15 text-purple-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات متوقعة" value={expectedOrders} color="text-[#FF7A00]" />
        <MiniStat title="مبيعات متوقعة" value={`${expectedSales.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="ضغط الذروة" value={peakRisk} color={peakRisk === "ضغط عالي" ? "text-red-300" : peakRisk === "ضغط متوسط" ? "text-yellow-300" : "text-green-300"} />
        <MiniStat title="مخاطر مخزون" value={stockRisk} color={stockRisk ? "text-yellow-300" : "text-green-300"} />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {forecastBars.map((value, index) => (
          <div key={index} className="flex h-28 items-end rounded-2xl bg-white/5 p-2">
            <div className="w-full rounded-xl bg-[#FF7A00]" style={{ height: `${value}%` }} />
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">
        التوقع: حضّر فريق إضافي إذا تجاوزت الطلبات النشطة {Math.max(3, Math.round(settings.prepTime / 6))} طلبات بنفس الوقت.
      </p>
    </Card>
  );
}

function DigitalTwinRestaurant({
  orders,
  menu,
  alerts,
  restaurantOpen,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  restaurantOpen: boolean;
  settings: Settings;
}) {
  const zones = [
    { name: "الاستقبال", status: restaurantOpen ? "نشط" : "متوقف", load: restaurantOpen ? 72 : 20 },
    { name: "المطبخ", status: orders.some((order) => order.status === "قيد التحضير") ? "يعمل" : "هادئ", load: 84 },
    { name: "التغليف", status: orders.some((order) => order.status === "جاهز") ? "ضغط" : "مستقر", load: 66 },
    { name: "التوصيل", status: orders.some((order) => order.status === "قيد التوصيل") ? "نشط" : "انتظار", load: 58 },
  ];

  return (
    <Card
      title="Digital Twin Restaurant"
      action={<Badge text={restaurantOpen ? settings.mode : "مغلق"} color={restaurantOpen ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />}
    >
      <div className="rounded-3xl border border-white/10 bg-black p-4">
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone) => (
            <div key={zone.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">{zone.name}</p>
                <span className="text-xs text-white/45">{zone.status}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${zone.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات داخل التوأم" value={orders.length} color="text-[#FF7A00]" />
        <MiniStat title="أصناف مراقبة" value={menu.length} color="text-white" />
        <MiniStat title="تنبيهات مرتبطة" value={alerts.length} color="text-yellow-300" />
      </div>
    </Card>
  );
}

function VoiceCopilot({
  orders,
  alerts,
  settings,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
  settings: Settings;
}) {
  const commands = [
    "سنبل، شكد الطلبات النشطة؟",
    "فعّل وضع مشغول إذا زاد الضغط.",
    "نبهني إذا تأخر طلب عن هدف التحضير.",
    "اقترح عرض بدون ما يزيد ضغط المطبخ.",
  ];
  const delayed = orders.filter((order) => order.prepMinutes > settings.prepTime && order.status !== "تم التسليم").length;

  return (
    <Card title="Voice Copilot" action={<Badge text="Voice Ready" color="bg-sky-500/15 text-sky-300" />}>
      <div className="rounded-3xl border border-sky-500/20 bg-sky-500/10 p-5">
        <p className="text-sm text-white/55">مساعد صوتي إداري</p>
        <h3 className="mt-2 text-xl font-black">جاهز لاستقبال أوامر المدير</h3>
        <p className="mt-2 text-sm text-white/55">
          {delayed > 0 ? `يوجد ${delayed} طلب يحتاج تنبيه صوتي.` : "لا توجد أوامر حرجة الآن."}
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {commands.map((command) => (
          <div key={command} className="rounded-2xl bg-white/5 p-3 text-sm text-white/65">🎙️ {command}</div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-black p-3 text-xs text-white/40">
        التنبيهات النشطة: {alerts.filter((alert) => alert.status !== "تم الحل").length}
      </p>
    </Card>
  );
}

function CrisisCenter({
  orders,
  menu,
  alerts,
  settings,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  settings: Settings;
}) {
  const crises = [
    {
      title: "تأخير طلبات",
      count: orders.filter((order) => order.prepMinutes > settings.prepTime && order.status !== "تم التسليم").length,
      action: "أرسل تنبيه للمطبخ وقلل قبول الطلبات الجديدة مؤقتاً.",
    },
    {
      title: "مخزون نافد",
      count: menu.filter((item) => item.outOfStock).length,
      action: "اخفِ الأصناف النافدة وفعّل بدائل مقترحة.",
    },
    {
      title: "تنبيهات عالية",
      count: alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل").length,
      action: "عالج التنبيهات العالية قبل إطلاق أي حملة.",
    },
  ];
  const totalCrises = crises.reduce((sum, crisis) => sum + crisis.count, 0);

  return (
    <Card
      title="Crisis Center"
      action={<Badge text={totalCrises ? "Action Needed" : "Clear"} color={totalCrises ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"} />}
    >
      {totalCrises === 0 && (
        <div className="mb-4 rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">
          ✅ لا توجد أزمات حرجة حالياً. التشغيل تحت السيطرة.
        </div>
      )}

      <div className="space-y-3">
        {crises.map((crisis) => (
          <div key={crisis.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{crisis.title}</p>
                <p className="mt-1 text-sm text-white/55">{crisis.action}</p>
              </div>
              <Badge text={`${crisis.count}`} color={crisis.count ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BusinessHealthMonitor({
  orders,
  menu,
  alerts,
  totalSales,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
  restaurantOpen: boolean;
}) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const completionRate = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const menuHealth = menu.length ? Math.round((menu.filter((item) => !item.outOfStock).length / menu.length) * 100) : 0;
  const alertHealth = Math.max(0, 100 - alerts.filter((alert) => alert.status !== "تم الحل").length * 14);
  const revenueHealth = totalSales >= 90000 ? 94 : totalSales >= 50000 ? 78 : 62;
  const health = Math.round((completionRate + menuHealth + alertHealth + revenueHealth + (restaurantOpen ? 90 : 55)) / 5);

  return (
    <Card
      title="Business Health Monitor"
      action={<Badge text={`${health}% Health`} color={health >= 80 ? "bg-green-500/15 text-green-300" : health >= 65 ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"} />}
    >
      <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white/50">صحة المشروع الآن</p>
            <h3 className="mt-1 text-3xl font-black text-white">{health}%</h3>
          </div>
          <p className="text-sm text-white/45">FUSE Enterprise Monitor</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${health}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="إنجاز الطلبات" value={`${completionRate}%`} color="text-green-300" />
        <MiniStat title="صحة المنيو" value={`${menuHealth}%`} color="text-[#FF7A00]" />
        <MiniStat title="هدوء التنبيهات" value={`${alertHealth}%`} color="text-yellow-300" />
        <MiniStat title="صحة الإيراد" value={`${revenueHealth}%`} color="text-sky-300" />
      </div>
    </Card>
  );
}

function StrategicGoalsCenter({
  orders,
  totalSales,
  menu,
}: {
  orders: Order[];
  totalSales: number;
  menu: MenuItem[];
}) {
  const goals = [
    { title: "هدف الطلبات", current: orders.length, target: 30, unit: "طلب" },
    { title: "هدف الإيراد", current: Math.round(totalSales / 1000), target: 650, unit: "ألف د.ع" },
    { title: "هدف الأصناف الفعالة", current: menu.filter((item) => item.active && !item.outOfStock).length, target: menu.length, unit: "صنف" },
  ];

  return (
    <Card title="Strategic Goals Center" action={<Badge text="CEO Goals" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {goals.map((goal) => {
          const percent = goal.target ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div key={goal.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-black">{goal.title}</span>
                <span className="text-white/55">{goal.current} / {goal.target} {goal.unit}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/40">نسبة الإنجاز: {percent}%</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AIAutomationCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const automations = [
    {
      title: "Auto Busy Mode",
      enabled: orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length >= 4,
      desc: "تفعيل وضع مشغول تلقائياً عند ضغط الطلبات.",
    },
    {
      title: "Auto Hide Stock",
      enabled: menu.some((item) => item.outOfStock),
      desc: "إخفاء الأصناف النافدة من المنيو بشكل ذكي.",
    },
    {
      title: "Auto Alert Routing",
      enabled: alerts.some((alert) => alert.level === "عالي"),
      desc: "توجيه التنبيهات العالية للمسؤول المناسب.",
    },
    {
      title: "Auto Campaign Pause",
      enabled: alerts.filter((alert) => alert.status !== "تم الحل").length >= 3,
      desc: "إيقاف الحملات مؤقتاً إذا زادت مشاكل التشغيل.",
    },
  ];

  return (
    <Card title="AI Automation Center" action={<Badge text="Automation Rules" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-3">
        {automations.map((automation) => (
          <div key={automation.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{automation.title}</p>
                <p className="mt-1 text-sm text-white/50">{automation.desc}</p>
              </div>
              <Badge
                text={automation.enabled ? "ON" : "READY"}
                color={automation.enabled ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}



function FleetEnterprise({ orders }: { orders: Order[] }) {
  const activeDeliveries = orders.filter((order) => order.status === "قيد التوصيل").length;
  const readyOrders = orders.filter((order) => order.status === "جاهز").length;
  const totalDriverOrders = drivers.reduce((sum, driver) => sum + driver.orders, 0);
  const fleetScore = Math.min(98, 72 + activeDeliveries * 6 + drivers.filter((driver) => driver.online).length * 5);

  return (
    <Card title="Fleet Enterprise" action={<Badge text="Fleet OS" color="bg-purple-500/15 text-purple-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="السائقون أونلاين" value={drivers.filter((driver) => driver.online).length} color="text-green-300" />
        <MiniStat title="قيد التوصيل" value={activeDeliveries} color="text-purple-300" />
        <MiniStat title="جاهزة للإسناد" value={readyOrders} color="text-sky-300" />
        <MiniStat title="Fleet Score" value={`${fleetScore}%`} color="text-[#FF7A00]" />
      </div>

      <div className="space-y-3">
        {drivers.map((driver) => {
          const share = totalDriverOrders ? Math.round((driver.orders / totalDriverOrders) * 100) : 0;
          return (
            <div key={driver.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{driver.name}</p>
                  <p className="mt-1 text-xs text-white/45">⭐ {driver.rating} — متوسط الوصول {driver.speed}</p>
                </div>
                <Badge text={driver.online ? "متاح" : "غير متاح"} color={driver.online ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/40">حصة تشغيل اليوم: {share}%</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function WarehouseCenter({ menu, orders }: { menu: MenuItem[]; orders: Order[] }) {
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const fastMoving = menu.filter((item) => item.ordersToday >= 20).length;
  const warehouseHealth = Math.max(50, 100 - outOfStock * 18 + fastMoving * 3);

  return (
    <Card title="Warehouse Center" action={<Badge text="Stock Control" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="صحة المستودع" value={`${warehouseHealth}%`} color="text-green-300" />
        <MiniStat title="أصناف نافدة" value={outOfStock} color="text-red-300" />
        <MiniStat title="سريعة الحركة" value={fastMoving} color="text-[#FF7A00]" />
        <MiniStat title="طلبات اليوم" value={orders.length} color="text-white" />
      </div>

      <div className="space-y-3">
        {menu.map((item) => {
          const stockLevel = item.outOfStock ? 8 : Math.max(25, 100 - item.ordersToday * 2);
          return (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-xs text-white/45">مبيعات اليوم: {item.ordersToday} — {item.category}</p>
                </div>
                <Badge text={item.outOfStock ? "إعادة طلب" : "مستقر"} color={item.outOfStock ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${stockLevel}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SupplierCenter({ menu, alerts }: { menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const suppliers = [
    { name: "مورد الطحين والمعجنات", reliability: 96, due: "اليوم 5:00 م", items: menu.filter((item) => ["فطور", "معجنات", "فطائر"].includes(item.category)).length },
    { name: "مورد الألبان والقيمر", reliability: 91, due: "غداً 9:00 ص", items: 3 },
    { name: "مورد المشروبات", reliability: 88, due: "بعد يومين", items: 6 },
  ];
  const purchaseRisk = alerts.filter((alert) => alert.type === "منيو" || alert.level === "عالي").length;

  return (
    <Card title="Supplier Center" action={<Badge text="Procurement" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="موردون نشطون" value={suppliers.length} color="text-[#FF7A00]" />
        <MiniStat title="مخاطر شراء" value={purchaseRisk} color={purchaseRisk ? "text-red-300" : "text-green-300"} />
        <MiniStat title="متوسط الاعتمادية" value={`${Math.round(suppliers.reduce((sum, supplier) => sum + supplier.reliability, 0) / suppliers.length)}%`} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <div key={supplier.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{supplier.name}</p>
                <p className="mt-1 text-xs text-white/45">تسليم قادم: {supplier.due} — أصناف مرتبطة: {supplier.items}</p>
              </div>
              <span className="text-lg font-black text-[#FF7A00]">{supplier.reliability}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HRCenter({ orders, settings }: { orders: Order[]; settings: Settings }) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const neededStaff = activeOrders >= 4 ? 8 : activeOrders >= 2 ? 6 : 4;
  const staff = [
    { role: "المطبخ", present: 3, required: neededStaff >= 6 ? 4 : 3 },
    { role: "التغليف", present: 2, required: activeOrders >= 3 ? 3 : 2 },
    { role: "الكاشير", present: 1, required: 1 },
    { role: "المتابعة", present: 1, required: 1 },
  ];

  return (
    <Card title="HR Center" action={<Badge text="People Ops" color="bg-green-500/15 text-green-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="المطلوب الآن" value={neededStaff} color="text-[#FF7A00]" />
        <MiniStat title="هدف التحضير" value={`${settings.prepTime} د`} color="text-yellow-300" />
        <MiniStat title="ضغط الطلبات" value={activeOrders} color="text-white" />
      </div>

      <div className="space-y-3">
        {staff.map((team) => (
          <div key={team.role} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{team.role}</p>
              <Badge text={`${team.present}/${team.required}`} color={team.present >= team.required ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />
            </div>
            <p className="mt-2 text-xs text-white/45">{team.present >= team.required ? "الفريق كافي حالياً." : "نحتاج دعم إضافي فوراً."}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SmartAccounting({ orders, totalSales }: { orders: Order[]; totalSales: number }) {
  const commission = Math.round(totalSales * 0.12);
  const foodCost = Math.round(totalSales * 0.42);
  const payroll = Math.round(totalSales * 0.16);
  const deliveryOps = Math.round(totalSales * 0.08);
  const net = totalSales - commission - foodCost - payroll - deliveryOps;
  const margin = totalSales ? Math.round((net / totalSales) * 100) : 0;

  const rows = [
    ["إجمالي المبيعات", totalSales, "text-[#FF7A00]"],
    ["عمولة المنصة", commission, "text-yellow-300"],
    ["تكلفة المواد", foodCost, "text-red-300"],
    ["رواتب تشغيلية", payroll, "text-sky-300"],
    ["تشغيل التوصيل", deliveryOps, "text-purple-300"],
    ["صافي تقديري", net, net >= 0 ? "text-green-300" : "text-red-300"],
  ] as const;

  return (
    <Card title="Smart Accounting" action={<Badge text={`${margin}% Margin`} color={margin >= 20 ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"} />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات محسوبة" value={orders.length} color="text-white" />
        <MiniStat title="صافي الربح" value={`${net.toLocaleString()} د.ع`} color={net >= 0 ? "text-green-300" : "text-red-300"} />
        <MiniStat title="هامش الربح" value={`${margin}%`} color="text-[#FF7A00]" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10">
        {rows.map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3 last:border-b-0">
            <span className="text-sm text-white/65">{label}</span>
            <span className={`font-black ${color}`}>{value.toLocaleString()} د.ع</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AICEO({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const ceoDecision = urgentOrders > 0
    ? "الأولوية الآن: تحريك الطلبات العاجلة وتجميد أي حملة تزيد الضغط."
    : outOfStock > 0
    ? "الأولوية الآن: معالجة المخزون قبل زيادة الإعلانات."
    : totalSales < 120000
    ? "الأولوية الآن: تفعيل عرض قصير لرفع الإيراد خلال ساعة الهبوط."
    : "التشغيل مستقر؛ ركّز على رفع متوسط السلة.";

  return (
    <Card title="AI CEO" action={<Badge text="Executive Agent" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm text-white/55">قرار المدير الذكي الآن</p>
        <h3 className="mt-2 text-xl font-black text-white">{ceoDecision}</h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="عاجلة" value={urgentOrders} color="text-red-300" />
        <MiniStat title="تنبيهات عالية" value={highAlerts} color="text-[#FF7A00]" />
        <MiniStat title="نفاد مخزون" value={outOfStock} color="text-sky-300" />
      </div>
    </Card>
  );
}

function FUSEOS({ orders, menu, alerts, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; restaurantOpen: boolean }) {
  const modules = [
    { name: "Orders OS", status: orders.length > 0 ? "ACTIVE" : "IDLE" },
    { name: "Menu OS", status: menu.some((item) => item.outOfStock) ? "WATCH" : "ACTIVE" },
    { name: "Alerts OS", status: alerts.some((alert) => alert.level === "عالي") ? "CRITICAL" : "ACTIVE" },
    { name: "Restaurant OS", status: restaurantOpen ? "OPEN" : "CLOSED" },
    { name: "AI OS", status: "LEARNING" },
    { name: "Finance OS", status: "SYNCED" },
  ];

  return (
    <Card title="FUSE OS" action={<Badge text="Unified Operating System" color="bg-white/10 text-white" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <div key={module.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{module.name}</p>
              <Badge
                text={module.status}
                color={module.status === "CRITICAL" || module.status === "CLOSED" ? "bg-red-500/15 text-red-300" : module.status === "WATCH" ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"}
              />
            </div>
            <p className="mt-2 text-xs text-white/40">متصل بلوحة FUSE Enterprise ويعمل ضمن النظام الموحد.</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GlobalOperationsCenter({ branches, orders, totalSales }: { branches: Branch[]; orders: Order[]; totalSales: number }) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const bestBranch = [...branches].sort((a, b) => b.sales - a.sales)[0];
  const liveLoad = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;

  return (
    <Card title="Global Operations Center" action={<Badge text="Command Network" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="الفروع" value={branches.length} color="text-white" />
        <MiniStat title="مبيعات الشبكة" value={`${(totalBranchSales + totalSales).toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="أفضل فرع" value={bestBranch?.name || "لا يوجد"} color="text-green-300" />
        <MiniStat title="Live Load" value={liveLoad} color="text-yellow-300" />
      </div>

      <div className="space-y-3">
        {branches.map((branch) => {
          const share = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;
          return (
            <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">{branch.area} — {branch.orders} طلب — ⭐ {branch.rating}</p>
                </div>
                <Badge text={branch.status} color={branch.status === "ممتاز" ? "bg-green-500/15 text-green-300" : branch.status === "جيد" ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function CustomerAppUltra({ orders, menu }: { orders: Order[]; menu: MenuItem[] }) {
  const favoriteItem = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];
  const activeOffers = menu.filter((item) => item.discount > 0 && !item.outOfStock).length;
  const averageTicket = orders.length ? Math.round(orders.reduce((sum, order) => sum + order.amount, 0) / orders.length) : 0;

  const appModules = [
    { title: "AI Meal Picks", desc: `اقتراح ${favoriteItem?.name || "وجبة"} حسب طلبات اليوم`, value: "ذكي" },
    { title: "Fast Reorder", desc: "إعادة الطلبات السابقة بنقرة واحدة", value: `${orders.length} طلب` },
    { title: "Offers Wallet", desc: "محفظة عروض وكوبونات مباشرة", value: activeOffers },
  ];

  return (
    <Card title="Customer App Ultra" action={<Badge text="Ecosystem App" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="توصيات AI" value={favoriteItem?.name || "لا يوجد"} color="text-[#FF7A00]" />
        <MiniStat title="عروض فعالة" value={activeOffers} color="text-green-300" />
        <MiniStat title="متوسط السلة" value={`${averageTicket.toLocaleString()} د.ع`} color="text-white" />
      </div>
      <div className="space-y-3">
        {appModules.map((module) => (
          <div key={module.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{module.title}</p>
                <p className="mt-1 text-xs text-white/45">{module.desc}</p>
              </div>
              <span className="rounded-2xl bg-black px-3 py-2 text-xs font-black text-[#FF7A00]">{module.value}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DriverAppUltra({ orders }: { orders: Order[] }) {
  const assignedOrders = orders.filter((order) => order.driver !== "غير محدد" && order.status !== "تم التسليم").length;
  const delivering = orders.filter((order) => order.status === "قيد التوصيل").length;
  const ready = orders.filter((order) => order.status === "جاهز").length;
  const driverScore = Math.min(99, 82 + delivering * 4 + ready * 2);

  return (
    <Card title="Driver App Ultra" action={<Badge text="Driver Command" color="bg-purple-500/15 text-purple-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="مهام السائقين" value={assignedOrders} color="text-purple-300" />
        <MiniStat title="قيد التوصيل" value={delivering} color="text-yellow-300" />
        <MiniStat title="جاهزة للاستلام" value={ready} color="text-sky-300" />
        <MiniStat title="Driver Score" value={`${driverScore}%`} color="text-green-300" />
      </div>
      <div className="mt-4 rounded-3xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-white/70">
        🚗 AI: وجّه أقرب سائق للطلبات الجاهزة أولاً، وفعّل مكافأة سرعة عند تجاوز 3 توصيلات بالساعة.
      </div>
    </Card>
  );
}

function RestaurantAppUltra({ orders, menu, alerts, settings }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; settings: Settings }) {
  const liveOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const menuHealth = menu.length ? Math.round((menu.filter((item) => item.active && !item.outOfStock).length / menu.length) * 100) : 0;
  const alertPressure = alerts.filter((alert) => alert.status !== "تم الحل").length;

  return (
    <Card title="Restaurant App Ultra" action={<Badge text={settings.mode} color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات مباشرة" value={liveOrders} color="text-yellow-300" />
        <MiniStat title="صحة المنيو" value={`${menuHealth}%`} color="text-green-300" />
        <MiniStat title="تنبيهات مفتوحة" value={alertPressure} color="text-red-300" />
        <MiniStat title="هدف التحضير" value={`${settings.prepTime} د`} color="text-[#FF7A00]" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {["قبول الطلبات", "تحديث الأصناف", "إدارة وقت التحضير"].map((item) => (
          <div key={item} className="rounded-2xl bg-white/5 p-4 text-sm font-bold text-white/75">{item}</div>
        ))}
      </div>
    </Card>
  );
}

function FranchiseApp({ branches, totalSales }: { branches: Branch[]; totalSales: number }) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const franchiseReadiness = Math.min(100, 70 + branches.filter((branch) => branch.status !== "يحتاج متابعة").length * 9);

  return (
    <Card title="Franchise App" action={<Badge text="Expansion Ready" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="الفروع" value={branches.length} color="text-white" />
        <MiniStat title="مبيعات الفروع" value={`${(totalBranchSales + totalSales).toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="جاهزية التوسع" value={`${franchiseReadiness}%`} color="text-green-300" />
        <MiniStat title="فروع تحتاج متابعة" value={branches.filter((branch) => branch.status === "يحتاج متابعة").length} color="text-yellow-300" />
      </div>
      <div className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-black">{branch.name}</p>
              <Badge text={branch.status} color={branch.status === "ممتاز" ? "bg-green-500/15 text-green-300" : branch.status === "جيد" ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"} />
            </div>
            <p className="mt-2 text-xs text-white/45">{branch.area} — {branch.orders} طلب — {branch.sales.toLocaleString()} د.ع</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AnalyticsCloud({ orders, menu, alerts, branches }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[] }) {
  const datasets = [
    { title: "Orders Data Lake", value: orders.length, status: "SYNCED" },
    { title: "Menu Signals", value: menu.reduce((sum, item) => sum + item.ordersToday, 0), status: "LIVE" },
    { title: "Alert Intelligence", value: alerts.length, status: "WATCH" },
    { title: "Branch Network", value: branches.length, status: "CONNECTED" },
  ];

  return (
    <Card title="Analytics Cloud" action={<Badge text="Cloud Insights" color="bg-white/10 text-white" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {datasets.map((data) => (
          <div key={data.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{data.title}</p>
                <p className="mt-1 text-xs text-white/40">تحليل سحابي محدث لحظياً</p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black text-[#FF7A00]">{data.value}</p>
                <p className="text-xs text-green-300">{data.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIAgents({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const agents = [
    { name: "Operations Agent", task: "يراقب الطلبات النشطة ويقترح نقل الأولويات", signal: orders.filter((order) => order.priority === "عاجل").length },
    { name: "Marketing Agent", task: "يصنع عروض حسب الأصناف الأكثر طلباً", signal: menu.filter((item) => item.discount > 0).length },
    { name: "Support Agent", task: "يتابع التنبيهات والشكاوى قبل التصعيد", signal: alerts.filter((alert) => alert.status !== "تم الحل").length },
    { name: "Finance Agent", task: "يراقب الإيراد والصافي ونقاط الهبوط", signal: orders.length },
  ];

  return (
    <Card title="AI Agents" action={<Badge text="Autonomous Team" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">🤖 {agent.name}</p>
                <p className="mt-1 text-sm text-white/55">{agent.task}</p>
              </div>
              <span className="rounded-2xl bg-black px-3 py-2 text-xs font-black text-[#FF7A00]">Signal {agent.signal}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SmartCityDashboard({ orders, branches }: { orders: Order[]; branches: Branch[] }) {
  const cityZones = ["زيونة", "الكرادة", "المنصور", "الجادرية", "العرصات"];
  const liveOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status));

  return (
    <Card title="Smart City Dashboard" action={<Badge text="City Live Map" color="bg-green-500/15 text-green-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="مناطق نشطة" value={cityZones.length} color="text-white" />
        <MiniStat title="طلبات المدينة" value={liveOrders.length} color="text-yellow-300" />
        <MiniStat title="فروع متصلة" value={branches.length} color="text-green-300" />
        <MiniStat title="Heat Level" value="متوسط" color="text-[#FF7A00]" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {cityZones.map((zone, index) => {
          const zoneOrders = orders.filter((order) => order.area === zone).length;
          const height = 35 + zoneOrders * 18 + index * 5;
          return (
            <div key={zone} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="mx-auto flex h-24 w-16 items-end rounded-2xl bg-black p-2">
                <div className="w-full rounded-xl bg-[#FF7A00]" style={{ height: `${Math.min(100, height)}%` }} />
              </div>
              <p className="mt-3 font-black">{zone}</p>
              <p className="mt-1 text-xs text-white/45">{zoneOrders} طلب</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AutonomousDispatch({ orders }: { orders: Order[] }) {
  const readyOrders = orders.filter((order) => order.status === "جاهز");
  const unassigned = orders.filter((order) => order.driver === "غير محدد" && order.status !== "تم التسليم");
  const dispatchScore = Math.max(55, 96 - unassigned.length * 14 + readyOrders.length * 3);

  return (
    <Card title="Autonomous Dispatch" action={<Badge text="Auto Routing" color="bg-red-500/15 text-red-300" />}>
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">قرار التوزيع الذكي</p>
        <h3 className="mt-2 text-xl font-black text-white">
          {unassigned.length > 0 ? `عيّن سائق فوراً لـ ${unassigned.length} طلب غير موزع.` : "كل الطلبات موزعة وتحت السيطرة."}
        </h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, dispatchScore)}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="جاهزة للتوزيع" value={readyOrders.length} color="text-sky-300" />
        <MiniStat title="غير موزعة" value={unassigned.length} color="text-red-300" />
        <MiniStat title="Dispatch Score" value={`${Math.min(100, dispatchScore)}%`} color="text-green-300" />
      </div>
    </Card>
  );
}


function AICOO({ orders, menu, alerts, settings }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; settings: Settings }) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const delayedOrders = orders.filter((order) => order.prepMinutes > settings.prepTime && order.status !== "تم التسليم").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const unresolved = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const operationsScore = Math.max(48, 100 - activeOrders * 4 - delayedOrders * 10 - outOfStock * 8 - unresolved * 6);
  const decisions = [
    delayedOrders > 0 ? `زيد دعم المطبخ لأن ${delayedOrders} طلب تجاوز هدف التحضير.` : "سرعة المطبخ ضمن الهدف الحالي.",
    outOfStock > 0 ? `اخفِ ${outOfStock} صنف نافد حتى لا تنخفض تجربة الزبون.` : "توفر المنيو جيد حالياً.",
    activeOrders >= 4 ? "فعّل وضع مشغول مؤقتاً لتقليل ضغط الطلبات." : "الضغط التشغيلي قابل للإدارة.",
  ];

  return (
    <Card title="AI COO" action={<Badge text="Operations Director" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">قرار مدير العمليات الذكي</p>
        <h3 className="mt-2 text-2xl font-black text-white">{operationsScore >= 80 ? "التشغيل مسيطر" : operationsScore >= 65 ? "متابعة مطلوبة" : "تدخل فوري"}</h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${operationsScore}%` }} />
        </div>
      </div>
      <div className="space-y-2 text-sm text-white/65">
        {decisions.map((decision) => <p key={decision}>• {decision}</p>)}
      </div>
    </Card>
  );
}

function AICFO({ orders, totalSales }: { orders: Order[]; totalSales: number }) {
  const commission = Math.round(totalSales * 0.12);
  const foodCost = Math.round(totalSales * 0.46);
  const operationCost = Math.round(totalSales * 0.18);
  const netProfit = totalSales - commission - foodCost - operationCost;
  const margin = totalSales ? Math.round((netProfit / totalSales) * 100) : 0;
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;

  return (
    <Card title="AI CFO" action={<Badge text="Finance Director" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="صافي الربح" value={`${netProfit.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="هامش الربح" value={`${margin}%`} color={margin >= 20 ? "text-green-300" : "text-yellow-300"} />
        <MiniStat title="عمولات" value={`${commission.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="طلبات مؤكدة" value={delivered} color="text-white" />
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">
        🧠 CFO: إذا ثبتت المبيعات على هذا المعدل، الأفضل رفع هامش الأصناف عالية الطلب 3% بدون التأثير على الطلب.
      </p>
    </Card>
  );
}

function AIMarketingDirector({ menu, orders, alerts }: { menu: MenuItem[]; orders: Order[]; alerts: RestaurantAlert[] }) {
  const topItem = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];
  const campaignPower = Math.min(100, 60 + orders.length * 5 - alerts.filter((alert) => alert.level === "عالي").length * 8);
  const segments = ["VIP", "Frequent", "At Risk"];

  return (
    <Card title="AI Marketing Director" action={<Badge text="Growth AI" color="bg-purple-500/15 text-purple-300" />}>
      <div className="mb-4 rounded-3xl border border-purple-500/20 bg-purple-500/10 p-4">
        <p className="text-sm text-white/55">حملة مقترحة الآن</p>
        <h3 className="mt-2 text-xl font-black text-white">روّج لـ {topItem?.name || "أفضل صنف"} مع توصيل مخفض لمدة ساعتين</h3>
        <p className="mt-2 text-sm text-white/50">Campaign Power: {campaignPower}%</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {segments.map((segment) => (
          <div key={segment} className="rounded-2xl bg-white/5 p-4">
            <p className="font-black">{segment}</p>
            <p className="mt-1 text-xs text-white/45">رسالة مخصصة + كوبون ذكي</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AICustomerAgent({ customers, orders, alerts }: { customers: Customer[]; orders: Order[]; alerts: RestaurantAlert[] }) {
  const atRisk = customers.filter((customer) => customer.segment === "At Risk").length;
  const vip = customers.filter((customer) => customer.segment === "VIP").length;
  const activeIssues = alerts.filter((alert) => alert.type === "جودة" || alert.type === "طلب").length;

  return (
    <Card title="AI Customer Agent" action={<Badge text="24/7 Support" color="bg-sky-500/15 text-sky-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="VIP" value={vip} color="text-[#FF7A00]" />
        <MiniStat title="At Risk" value={atRisk} color="text-red-300" />
        <MiniStat title="تذاكر نشطة" value={activeIssues} color="text-yellow-300" />
      </div>
      <div className="mt-4 space-y-3">
        {customers.slice(0, 4).map((customer) => (
          <div key={customer.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{customer.name}</p>
                <p className="text-xs text-white/45">{customer.segment} — {customer.orders} طلب — رضا {customer.satisfaction}%</p>
              </div>
              <span className="rounded-2xl bg-black px-3 py-2 text-xs text-[#FF7A00]">رد تلقائي</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PredictiveSupplyChain({ menu, orders, alerts }: { menu: MenuItem[]; orders: Order[]; alerts: RestaurantAlert[] }) {
  const demand = menu.map((item) => ({ ...item, forecast: Math.max(10, item.ordersToday + orders.length * 2 - (item.outOfStock ? 6 : 0)) }));
  const shortageRisk = menu.filter((item) => item.outOfStock || item.ordersToday >= 28).length;

  return (
    <Card title="Predictive Supply Chain" action={<Badge text="Supply Forecast" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="خطر نفاد" value={shortageRisk} color="text-red-300" />
        <MiniStat title="إشارات موردين" value={alerts.filter((alert) => alert.type === "منيو").length} color="text-yellow-300" />
        <MiniStat title="طلب متوقع" value={demand.reduce((sum, item) => sum + item.forecast, 0)} color="text-[#FF7A00]" />
      </div>
      <div className="space-y-3">
        {demand.map((item) => (
          <div key={item.id} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{item.name}</p>
              <p className="text-sm text-[#FF7A00]">Forecast {item.forecast}</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, item.forecast * 2)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AutonomousRestaurantNetwork({ branches, orders }: { branches: Branch[]; orders: Order[] }) {
  const networkLoad = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const networkScore = Math.max(55, 96 - networkLoad * 5);

  return (
    <Card title="Autonomous Restaurant Network" action={<Badge text="Self Operating" color="bg-green-500/15 text-green-300" />}>
      <div className="mb-4 rounded-3xl border border-green-500/20 bg-green-500/10 p-4">
        <p className="text-sm text-white/55">Network Autonomy Score</p>
        <h3 className="mt-2 text-3xl font-black text-green-300">{networkScore}%</h3>
        <p className="mt-2 text-sm text-white/55">كل فرع مرتبط بالطلب، المخزون، التسويق، والسائقين.</p>
      </div>
      <div className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{branch.name}</p>
                <p className="text-xs text-white/45">{branch.area} — {branch.status}</p>
              </div>
              <Badge text="Auto Sync" color="bg-green-500/15 text-green-300" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FUSEUniverse({ orders, menu, alerts, branches, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; totalSales: number }) {
  const universeScore = Math.max(50, 100 - alerts.filter((alert) => alert.status !== "تم الحل").length * 6 + branches.length * 2);
  const modules = ["Vendor", "Customer", "Driver", "Franchise", "Finance", "AI", "Cloud", "Dispatch"];

  return (
    <Card title="FUSE Universe" action={<Badge text="Master Control" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">المنظومة الكاملة</p>
        <h3 className="mt-2 text-2xl font-black text-white">{universeScore}% Connected Intelligence</h3>
        <p className="mt-2 text-sm text-white/55">{orders.length} طلب، {menu.length} صنف، {branches.length} فروع، {totalSales.toLocaleString()} د.ع مبيعات.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {modules.map((module) => (
          <div key={module} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="font-black">{module}</p>
            <p className="mt-1 text-xs text-green-300">ONLINE</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SelfLearningEngine({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const learningSignals = orders.length + menu.reduce((sum, item) => sum + item.ordersToday, 0) + alerts.length * 3;
  const models = [
    { title: "Order Pattern Model", progress: 92 },
    { title: "Menu Demand Model", progress: 88 },
    { title: "Delay Risk Model", progress: 81 },
    { title: "Customer Retention Model", progress: 76 },
  ];

  return (
    <Card title="Self-Learning Engine" action={<Badge text={`${learningSignals} Signals`} color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {models.map((model) => (
          <div key={model.title} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{model.title}</p>
              <p className="text-sm text-[#FF7A00]">{model.progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${model.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FutureSimulationCenter({ orders, branches, totalSales }: { orders: Order[]; branches: Branch[]; totalSales: number }) {
  const scenarios = [
    { title: "فتح فرع جديد", impact: "+28% مبيعات", confidence: 82 },
    { title: "زيادة السائقين وقت الذروة", impact: "-18% تأخير", confidence: 89 },
    { title: "حملة VIP أسبوعية", impact: "+14% تكرار طلب", confidence: 76 },
  ];
  const projectedSales = Math.round(totalSales * (1 + branches.length * 0.08 + orders.length * 0.01));

  return (
    <Card title="Future Simulation Center" action={<Badge text="Scenario AI" color="bg-sky-500/15 text-sky-300" />}>
      <MiniStat title="مبيعات متوقعة بعد التوسع" value={`${projectedSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
      <div className="mt-4 space-y-3">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{scenario.title}</p>
                <p className="mt-1 text-xs text-white/45">الأثر المتوقع: {scenario.impact}</p>
              </div>
              <span className="text-sm font-black text-green-300">{scenario.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


function QuantumAICore({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const unresolvedAlerts = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const availableMenu = menu.filter((item) => item.active && !item.outOfStock).length;
  const quantumScore = Math.max(52, Math.min(99, 92 - unresolvedAlerts * 4 - activeOrders * 2 + availableMenu * 3));
  const cores = [
    { title: "Decision Core", value: "98%", hint: "قرارات تشغيلية فورية" },
    { title: "Revenue Core", value: `${Math.round(totalSales * 1.18).toLocaleString()} د.ع`, hint: "إيراد متوقع" },
    { title: "Risk Core", value: `${unresolvedAlerts}`, hint: "مخاطر مفتوحة" },
  ];

  return (
    <Card title="Quantum AI Core" action={<Badge text="Phase 8" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">العقل الأعلى للنظام</p>
        <h3 className="mt-2 text-3xl font-black text-[#FF7A00]">{quantumScore}% Quantum Intelligence</h3>
        <p className="mt-2 text-sm text-white/55">يربط الطلبات، المنيو، التنبيهات، الإيرادات، والقرارات داخل طبقة واحدة.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cores.map((core) => (
          <div key={core.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/45">{core.title}</p>
            <p className="mt-2 text-xl font-black text-white">{core.value}</p>
            <p className="mt-1 text-xs text-white/40">{core.hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIBoardOfDirectors({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const urgent = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const directors = [
    { role: "AI Chairman", decision: totalSales > 70000 ? "وسّع التشغيل وقت الذروة" : "ركز على رفع متوسط الطلب", color: "text-[#FF7A00]" },
    { role: "AI Operations", decision: urgent ? `حرّك ${urgent} طلب عاجل فوراً` : "التشغيل مستقر", color: urgent ? "text-red-300" : "text-green-300" },
    { role: "AI Menu", decision: outOfStock ? `عالج ${outOfStock} صنف نافد` : "المنيو جاهز للبيع", color: outOfStock ? "text-yellow-300" : "text-green-300" },
    { role: "AI Risk", decision: alerts.length ? "راجع التنبيهات قبل التوسع" : "لا توجد مخاطر ظاهرة", color: "text-sky-300" },
  ];

  return (
    <Card title="AI Board Of Directors" action={<Badge text="Board Room" color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {directors.map((director) => (
          <div key={director.role} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className={`font-black ${director.color}`}>{director.role}</p>
            <p className="mt-2 text-sm text-white/65">{director.decision}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GlobalExpansionCenter({ branches, orders, totalSales }: { branches: Branch[]; orders: Order[]; totalSales: number }) {
  const expansionScore = Math.min(96, 64 + branches.length * 8 + orders.length * 2);
  const cities = ["بغداد", "أربيل", "البصرة", "النجف"];

  return (
    <Card title="Global Expansion Center" action={<Badge text={`${expansionScore}% Ready`} color="bg-green-500/15 text-green-300" />}>
      <MiniStat title="جاهزية التوسع" value={`${expansionScore}%`} color="text-[#FF7A00]" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cities.map((city, index) => (
          <div key={city} className="rounded-2xl bg-white/5 p-4">
            <p className="font-black">{city}</p>
            <p className="mt-1 text-xs text-white/45">فرصة نمو: {Math.round((totalSales / 10000) + index * 7)}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RealTimeWorldMonitor({ orders, menu, alerts, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; restaurantOpen: boolean }) {
  const systems = [
    { title: "Orders Cloud", state: "ONLINE", metric: `${orders.length} Orders` },
    { title: "Menu Engine", state: "SYNCED", metric: `${menu.length} Items` },
    { title: "Alert Radar", state: alerts.length ? "WATCH" : "CLEAR", metric: `${alerts.length} Alerts` },
    { title: "Restaurant Node", state: restaurantOpen ? "OPEN" : "CLOSED", metric: restaurantOpen ? "Active" : "Paused" },
  ];

  return (
    <Card title="Real-Time World Monitor" action={<Badge text="Live Grid" color="bg-sky-500/15 text-sky-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {systems.map((system) => (
          <div key={system.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{system.title}</p>
              <span className="text-xs font-black text-green-300">{system.state}</span>
            </div>
            <p className="mt-2 text-xs text-white/45">{system.metric}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AIWorkforce({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const bots = [
    { name: "Order Agent", task: "يراقب الطلبات النشطة", load: orders.length * 12 },
    { name: "Menu Agent", task: "يفحص توفر الأصناف", load: menu.filter((item) => item.outOfStock).length * 30 + 45 },
    { name: "Risk Agent", task: "يعالج التنبيهات", load: alerts.length * 24 },
    { name: "Growth Agent", task: "يقترح حملات ومكافآت", load: 68 },
  ];

  return (
    <Card title="AI Workforce" action={<Badge text="Virtual Staff" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {bots.map((bot) => {
          const load = Math.min(98, Math.max(22, bot.load));
          return (
            <div key={bot.name} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black">{bot.name}</p>
                  <p className="mt-1 text-xs text-white/45">{bot.task}</p>
                </div>
                <p className="text-sm font-black text-[#FF7A00]">{load}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${load}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function InnovationLab({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const experiments = [
    { title: "Dynamic Breakfast Bundles", result: "+16% متوسط الطلب" },
    { title: "AI Delay Prevention", result: "-22% تأخير" },
    { title: "VIP Retention Push", result: "+11% رجوع العملاء" },
  ];
  const labScore = Math.min(95, 70 + orders.length + menu.length - alerts.length);

  return (
    <Card title="Innovation Lab" action={<Badge text={`${labScore}% Lab Score`} color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="space-y-3">
        {experiments.map((experiment) => (
          <div key={experiment.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{experiment.title}</p>
            <p className="mt-1 text-sm text-green-300">{experiment.result}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DigitalEarthDashboard({ branches, orders, totalSales }: { branches: Branch[]; orders: Order[]; totalSales: number }) {
  return (
    <Card title="Digital Earth Dashboard" action={<Badge text="Geo Ops" color="bg-green-500/15 text-green-300" />}>
      <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.22),rgba(255,255,255,0.04),rgba(0,0,0,0.2))] p-5">
        <p className="text-sm text-white/55">الخريطة التشغيلية العالمية</p>
        <h3 className="mt-2 text-2xl font-black text-white">{branches.length} Nodes / {orders.length} Live Orders</h3>
        <p className="mt-2 text-sm text-[#FF7A00]">{totalSales.toLocaleString()} د.ع حركة مالية على الشبكة</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{branch.name}</p>
              <p className="text-sm text-green-300">{branch.status}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InfiniteLearningEngine({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const cycles = orders.length * 4 + menu.reduce((sum, item) => sum + item.ordersToday, 0) + alerts.length * 9;
  const layers = ["Demand Memory", "Risk Memory", "Customer Memory", "Finance Memory", "Dispatch Memory"];

  return (
    <Card title="Infinite Learning Engine" action={<Badge text={`${cycles} Cycles`} color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {layers.map((layer, index) => {
          const progress = Math.min(97, 74 + index * 4 + orders.length);
          return (
            <div key={layer} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black">{layer}</p>
                <p className="text-sm text-[#FF7A00]">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function FUSEGalaxyPlatform({ orders, menu, alerts, branches, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; totalSales: number }) {
  const galaxyPower = Math.min(99, 80 + branches.length * 3 + orders.length - alerts.length);
  const planets = ["Vendor Galaxy", "Driver Galaxy", "Customer Galaxy", "Finance Galaxy", "AI Galaxy", "Franchise Galaxy"];

  return (
    <Card title="FUSE Galaxy Platform" action={<Badge text={`${galaxyPower}% Power`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">المنصة العليا التي تربط كل الأنظمة</p>
        <h3 className="mt-2 text-2xl font-black text-white">Galaxy Operating Layer</h3>
        <p className="mt-2 text-sm text-white/55">{orders.length} طلب، {menu.length} صنف، {branches.length} فروع، {totalSales.toLocaleString()} د.ع.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {planets.map((planet) => (
          <div key={planet} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="font-black">{planet}</p>
            <p className="mt-1 text-xs text-green-300">CONNECTED</p>
          </div>
        ))}
      </div>
    </Card>
  );
}


function AIChairman({ orders, menu, alerts, totalSales, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number; restaurantOpen: boolean }) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const chairmanScore = Math.max(58, Math.min(99, 94 - urgentOrders * 5 - highAlerts * 4 - outOfStock * 3 + (restaurantOpen ? 3 : -12)));
  const decision = chairmanScore >= 88 ? "استمر بالتوسع وادفع التسويق" : chairmanScore >= 74 ? "ثبت التشغيل وعالج نقاط الضغط" : "أوقف التوسع مؤقتاً وركز على الإنقاذ";

  return (
    <Card title="AI Chairman" action={<Badge text={`${chairmanScore}% Authority`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm text-white/55">الرئيس الأعلى لمنظومة FUSE</p>
        <h3 className="mt-2 text-2xl font-black text-white">{decision}</h3>
        <p className="mt-2 text-sm text-white/60">يراقب الإيرادات، المخاطر، المخزون، وسرعة التشغيل ويصدر قرار إداري واحد.</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="إيراد تحت القرار" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="مخاطر حرجة" value={urgentOrders + highAlerts} color="text-red-300" />
        <MiniStat title="أصناف نافدة" value={outOfStock} color="text-yellow-300" />
      </div>
    </Card>
  );
}

function AutonomousCompany({ orders, menu, alerts, branches, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; totalSales: number }) {
  const automation = Math.min(98, 72 + orders.length * 2 + branches.length * 3 - alerts.length);
  const systems = [
    { name: "Operations Auto-Pilot", value: automation },
    { name: "Pricing Auto-Pilot", value: Math.min(96, 68 + menu.length * 6) },
    { name: "Finance Auto-Pilot", value: Math.min(97, 70 + Math.round(totalSales / 50000)) },
  ];

  return (
    <Card title="Autonomous Company" action={<Badge text="Self Operating" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-3">
        {systems.map((system) => (
          <div key={system.name} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{system.name}</p>
              <p className="text-sm font-black text-[#FF7A00]">{system.value}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${system.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GlobalFranchiseNetwork({ branches, totalSales }: { branches: Branch[]; totalSales: number }) {
  const countries = ["Iraq", "GCC Ready", "Turkey Ready", "Jordan Ready"];
  return (
    <Card title="Global Franchise Network" action={<Badge text={`${branches.length} Active Nodes`} color="bg-purple-500/15 text-purple-300" />}>
      <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/55">شبكة امتيازات قابلة للتوسع من الفروع الحالية</p>
        <h3 className="mt-2 text-2xl font-black text-[#FF7A00]">{totalSales.toLocaleString()} د.ع Franchise Volume</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {countries.map((country) => (
          <div key={country} className="rounded-2xl bg-white/5 p-4 text-center">
            <p className="font-black">{country}</p>
            <p className="mt-1 text-xs text-green-300">EXPANSION READY</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SmartEconomyEngine({ orders, menu, totalSales }: { orders: Order[]; menu: MenuItem[]; totalSales: number }) {
  const demand = menu.reduce((sum, item) => sum + item.ordersToday, 0);
  const economyIndex = Math.min(99, 60 + orders.length * 3 + Math.round(demand / 6));
  const commission = Math.round(totalSales * 0.12);
  const incentives = Math.round(totalSales * 0.05);

  return (
    <Card title="Smart Economy Engine" action={<Badge text={`${economyIndex}% Market Index`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="حجم الاقتصاد" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="عمولة تقديرية" value={`${commission.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="حوافز النمو" value={`${incentives.toLocaleString()} د.ع`} color="text-yellow-300" />
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">AI Economy: ارفع الحوافز وقت الركود وخفّض الخصومات وقت الذروة حتى تحافظ على الربحية.</p>
    </Card>
  );
}

function HyperPredictiveAI({ orders, menu, alerts, branches }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[] }) {
  const predictions = [
    { title: "ضغط الطلبات بعد ساعة", value: `${Math.min(99, 62 + orders.length * 5)}%` },
    { title: "احتمال نفاد صنف", value: `${Math.min(91, 30 + menu.filter((item) => item.outOfStock).length * 25 + alerts.length * 4)}%` },
    { title: "فرصة توسع فرع جديد", value: `${Math.min(94, 55 + branches.length * 8)}%` },
  ];

  return (
    <Card title="Hyper Predictive AI" action={<Badge text="Ultra Forecast" color="bg-sky-500/15 text-sky-300" />}>
      <div className="space-y-3">
        {predictions.map((prediction) => (
          <div key={prediction.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{prediction.title}</p>
              <p className="text-lg font-black text-[#FF7A00]">{prediction.value}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FUSEMetaverse({ orders, branches, totalSales }: { orders: Order[]; branches: Branch[]; totalSales: number }) {
  return (
    <Card title="FUSE Metaverse" action={<Badge text="Virtual Ops" color="bg-purple-500/15 text-purple-300" />}>
      <div className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-5">
        <p className="text-sm text-white/55">نسخة افتراضية للمنظومة التشغيلية</p>
        <h3 className="mt-2 text-2xl font-black text-white">{branches.length} Virtual Restaurants</h3>
        <p className="mt-2 text-sm text-purple-200">{orders.length} طلب حي — {totalSales.toLocaleString()} د.ع حركة داخل العالم الافتراضي.</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        {['Lobby', 'Kitchen', 'Dispatch'].map((zone) => (
          <div key={zone} className="rounded-2xl bg-white/5 p-4">
            <p className="font-black">{zone}</p>
            <p className="mt-1 text-xs text-green-300">SYNCED</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function UniversalOperationsSystem({ orders, menu, alerts, branches, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; restaurantOpen: boolean }) {
  const modules = [
    { name: "Orders", value: orders.length },
    { name: "Menu", value: menu.length },
    { name: "Alerts", value: alerts.length },
    { name: "Branches", value: branches.length },
  ];

  return (
    <Card title="Universal Operations System" action={<Badge text={restaurantOpen ? "ONLINE" : "OFFLINE"} color={restaurantOpen ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {modules.map((module) => (
          <div key={module.name} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-xs text-white/45">{module.name}</p>
            <p className="mt-2 text-2xl font-black text-[#FF7A00]">{module.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/65">النظام الشامل يربط الطلبات، الفروع، المخزون، التمويل، السائقين، والذكاء الاصطناعي بطبقة تشغيل واحدة.</p>
    </Card>
  );
}

function AIExecutiveCouncil({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const council = [
    { role: "AI Chairman", advice: totalSales > 80000 ? "وسع الحملة" : "ثبت الإيراد" },
    { role: "AI COO", advice: orders.length > 4 ? "ادعم التشغيل" : "التشغيل مستقر" },
    { role: "AI CFO", advice: "راقب هامش الربح" },
    { role: "AI CMO", advice: menu.some((item) => item.discount > 0) ? "فعّل Retargeting" : "أطلق عرض ذكي" },
    { role: "AI Risk", advice: alerts.length > 2 ? "عالج التنبيهات" : "المخاطر منخفضة" },
  ];

  return (
    <Card title="AI Executive Council" action={<Badge text="Council Online" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-3">
        {council.map((member) => (
          <div key={member.role} className="rounded-2xl bg-white/5 p-4">
            <p className="font-black text-[#FF7A00]">{member.role}</p>
            <p className="mt-1 text-sm text-white/65">{member.advice}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EternalLearningCore({ orders, menu, alerts, branches }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[] }) {
  const memory = orders.length * 12 + menu.reduce((sum, item) => sum + item.ordersToday, 0) + branches.length * 20 + alerts.length * 7;
  const learningLayers = ["Sales Memory", "Customer Taste", "Delay Patterns", "Branch Signals", "Risk Signals", "Expansion Signals"];

  return (
    <Card title="Eternal Learning Core" action={<Badge text={`${memory} Memory Units`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {learningLayers.map((layer, index) => {
          const progress = Math.min(99, 64 + index * 5 + orders.length + branches.length);
          return (
            <div key={layer} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black">{layer}</p>
                <p className="text-sm text-[#FF7A00]">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function AIFounder({ orders, menu, alerts, totalSales, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number; restaurantOpen: boolean }) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const risk = alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل").length;
  const founderScore = Math.max(50, Math.min(100, 92 + (restaurantOpen ? 3 : -18) - risk * 7 - activeOrders * 2 + Math.round(totalSales / 50000)));
  const decisions = [
    founderScore >= 88 ? "استمر بالتوسع المرحلي لأن مؤشرات التشغيل قوية." : "ثبت التشغيل قبل إضافة فروع جديدة.",
    menu.some((item) => item.outOfStock) ? "أوقف ظهور الأصناف النافدة من كل قنوات البيع." : "المنيو جاهز لاستقبال حملة مبيعات جديدة.",
    activeOrders >= 4 ? "فعّل دعم مطبخ إضافي لمدة ساعة." : "حافظ على سرعة التحضير الحالية.",
  ];

  return (
    <Card title="AI Founder" action={<Badge text={`${founderScore}% Founder Score`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm text-white/55">Founder Command</p>
        <h3 className="mt-2 text-2xl font-black text-white">{founderScore >= 88 ? "النظام جاهز للنمو" : "النظام يحتاج تثبيت"}</h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${founderScore}%` }} />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {decisions.map((decision) => (
          <div key={decision} className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">🧠 {decision}</div>
        ))}
      </div>
    </Card>
  );
}

function SelfEvolvingPlatform({ orders, menu, alerts, branches, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; totalSales: number }) {
  const modules = [
    { name: "Orders Engine", progress: Math.min(99, 70 + orders.length * 4) },
    { name: "Menu Optimizer", progress: Math.min(99, 72 + menu.filter((item) => item.ordersToday > 15).length * 6) },
    { name: "Risk Resolver", progress: Math.max(55, 95 - alerts.filter((alert) => alert.status !== "تم الحل").length * 8) },
    { name: "Branch Learning", progress: Math.min(99, 68 + branches.length * 8) },
    { name: "Revenue Memory", progress: Math.min(99, 66 + Math.round(totalSales / 20000)) },
  ];

  return (
    <Card title="Self-Evolving Platform" action={<Badge text="Auto Upgrade" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {modules.map((module) => (
          <div key={module.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{module.name}</p>
              <p className="text-sm font-black text-[#FF7A00]">{module.progress}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${module.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GlobalAutonomousNetwork({ orders, branches, alerts }: { orders: Order[]; branches: Branch[]; alerts: RestaurantAlert[] }) {
  const network = [
    { node: "Baghdad Core", status: "Active", load: orders.length * 12 },
    { node: "Branch Mesh", status: "Synced", load: branches.length * 18 },
    { node: "Risk Layer", status: alerts.length > 2 ? "Watching" : "Stable", load: alerts.length * 15 },
    { node: "Dispatch Grid", status: "Live", load: 76 },
  ];

  return (
    <Card title="Global Autonomous Network" action={<Badge text="Network Live" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {network.map((node) => (
          <div key={node.node} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{node.node}</p>
              <Badge text={node.status} color={node.status === "Stable" || node.status === "Active" || node.status === "Live" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"} />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, node.load)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function InfiniteAnalytics({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const avg = orders.length ? Math.round(totalSales / orders.length) : 0;
  const data = [
    { title: "Revenue Depth", value: `${totalSales.toLocaleString()} د.ع`, color: "text-[#FF7A00]" },
    { title: "Completion Intelligence", value: `${orders.length ? Math.round((delivered / orders.length) * 100) : 0}%`, color: "text-green-300" },
    { title: "Menu Demand Index", value: menu.reduce((sum, item) => sum + item.ordersToday, 0), color: "text-yellow-300" },
    { title: "Risk Signals", value: alerts.filter((alert) => alert.status !== "تم الحل").length, color: "text-red-300" },
    { title: "Average Basket", value: `${avg.toLocaleString()} د.ع`, color: "text-white" },
  ];

  return (
    <Card title="Infinite Analytics">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {data.map((item) => <MiniStat key={item.title} title={item.title} value={item.value} color={item.color} />)}
      </div>
    </Card>
  );
}

function QuantumDecisionsEngine({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const scenarios = [
    { title: "رفع المبيعات", probability: totalSales > 80000 ? 91 : 74, action: "عرض ذكي على الأصناف الأعلى طلباً" },
    { title: "تقليل التأخير", probability: orders.some((order) => order.prepMinutes > 20) ? 88 : 69, action: "زيادة دعم التحضير مؤقتاً" },
    { title: "استقرار المنيو", probability: menu.some((item) => item.outOfStock) ? 63 : 92, action: "مزامنة المخزون مع الواجهة" },
    { title: "خفض المخاطر", probability: alerts.length > 2 ? 82 : 94, action: "إغلاق التنبيهات الحرجة أولاً" },
  ];

  return (
    <Card title="Quantum Decisions Engine" action={<Badge text="Decision Matrix" color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{scenario.title}</p>
                <p className="mt-1 text-sm text-white/55">{scenario.action}</p>
              </div>
              <p className="text-2xl font-black text-[#FF7A00]">{scenario.probability}%</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DigitalCivilizationDashboard({ branches, orders, totalSales }: { branches: Branch[]; orders: Order[]; totalSales: number }) {
  const cities = ["Baghdad", "Basra", "Erbil", "Najaf", "Karbala"];
  return (
    <Card title="Digital Civilization Dashboard" action={<Badge text="City OS" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="فروع متصلة" value={branches.length} color="text-[#FF7A00]" />
        <MiniStat title="طلبات حضرية" value={orders.length} color="text-green-300" />
        <MiniStat title="اقتصاد رقمي" value={`${totalSales.toLocaleString()} د.ع`} color="text-yellow-300" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {cities.map((city, index) => (
          <div key={city} className="rounded-2xl bg-white/5 p-4 text-center">
            <p className="font-black">{city}</p>
            <p className="mt-2 text-xs text-green-300">READY {78 + index * 4}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FUSENexus({ orders, menu, alerts, branches, totalSales, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[]; totalSales: number; restaurantOpen: boolean }) {
  const nexusScore = Math.min(99, 60 + orders.length * 3 + menu.length * 2 + branches.length * 5 + Math.round(totalSales / 50000) - alerts.length * 2 + (restaurantOpen ? 5 : -10));
  const links = ["Vendor UI", "Enterprise", "Super Platform", "Ecosystem", "Infinity", "Quantum", "Omega", "Singularity"];
  return (
    <Card title="FUSE Nexus" action={<Badge text={`${nexusScore}% Nexus`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm text-white/55">النواة المركزية لكل منظومة FUSE</p>
        <h3 className="mt-2 text-3xl font-black text-white">Unified Intelligence Layer</h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${nexusScore}%` }} />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => <span key={link} className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-white/65">{link}</span>)}
      </div>
    </Card>
  );
}

function AutonomousAIAgentsNetwork({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const agents = [
    { name: "Order Agent", mission: `${orders.length} طلب تحت المراقبة`, status: "Active" },
    { name: "Menu Agent", mission: `${menu.length} صنف قيد التحليل`, status: "Learning" },
    { name: "Risk Agent", mission: `${alerts.length} تنبيه قيد الفحص`, status: alerts.length ? "Watching" : "Stable" },
    { name: "Revenue Agent", mission: "تحسين متوسط السلة", status: "Active" },
  ];
  return (
    <Card title="Autonomous AI Agents Network" action={<Badge text="Agents Online" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {agents.map((agent) => (
          <div key={agent.name} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#FF7A00]">{agent.name}</p>
                <p className="mt-1 text-sm text-white/60">{agent.mission}</p>
              </div>
              <Badge text={agent.status} color={agent.status === "Watching" ? "bg-yellow-500/15 text-yellow-300" : "bg-green-500/15 text-green-300"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecursiveIntelligenceEngine({ orders, menu, alerts, branches }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; branches: Branch[] }) {
  const loops = [
    { title: "تعلم من الطلبات", value: orders.length * 14 },
    { title: "تعلم من المنيو", value: menu.reduce((sum, item) => sum + item.ordersToday, 0) },
    { title: "تعلم من التنبيهات", value: alerts.length * 19 },
    { title: "تعلم من الفروع", value: branches.length * 22 },
  ];
  return (
    <Card title="Recursive Intelligence Engine" action={<Badge text="Self Improving" color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {loops.map((loop, index) => {
          const progress = Math.min(99, 55 + index * 8 + Math.round(loop.value / 4));
          return (
            <div key={loop.title} className="rounded-2xl bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black">{loop.title}</p>
                <p className="text-sm text-[#FF7A00]">{progress}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}


function ProductionArchitectureCenter({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const liveCollections = ["orders", "restaurants", "driversStatus", "menuItems", "notifications", "ratings"];
  const readiness = Math.min(
    96,
    58 + liveCollections.length * 4 + activeOrders * 3 - alerts.length
  );

  return (
    <Card
      title="FUSE Production Architecture"
      action={<Badge text="Real System" color="bg-green-500/15 text-green-300" />}
    >
      <div className="rounded-3xl border border-[#FF7A00]/25 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">التحول من صفحة Demo إلى نظام إنتاج فعلي</p>
        <h3 className="mt-2 text-2xl font-black text-white">
          Production Readiness: <span className="text-[#FF7A00]">{readiness}%</span>
        </h3>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/50">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${readiness}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="Live Collections" value={liveCollections.length} color="text-green-300" />
        <MiniStat title="Active Orders" value={activeOrders} color="text-yellow-300" />
        <MiniStat title="Menu Items" value={menu.length} color="text-white" />
        <MiniStat title="Today Revenue" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
      </div>

      <div className="mt-4 space-y-2 text-sm text-white/65">
        <p>• الخطوة الحالية: ربط الـ UI مع Firestore Collections بدل البيانات التجريبية.</p>
        <p>• بعدها: صلاحيات Roles، إشعارات حقيقية، تقارير PDF/Excel، وخرائط تشغيل مباشرة.</p>
      </div>
    </Card>
  );
}

function FirestoreLiveDataCenter() {
  const collections = [
    { name: "orders", desc: "طلبات مباشرة مع status وdriverId وrestaurantId", status: "جاهز للربط" },
    { name: "menuItems", desc: "إدارة الأصناف والأسعار والتوفر", status: "جاهز للربط" },
    { name: "driversStatus", desc: "موقع السائق وحالة Online/Offline", status: "يحتاج Map" },
    { name: "notifications", desc: "تنبيهات الإدارة والمطعم والسائق", status: "جاهز" },
    { name: "ratings", desc: "تقييم العميل للمطعم والسائق", status: "جاهز" },
  ];

  return (
    <Card title="Firestore Live Data Center" action={<Badge text="Firebase" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="space-y-3">
        {collections.map((item) => (
          <div key={item.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[#FF7A00]">{item.name}</p>
                <p className="mt-1 text-sm text-white/55">{item.desc}</p>
              </div>
              <Badge
                text={item.status}
                color={item.status === "جاهز للربط" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuthRolesMatrix() {
  const roles = [
    { role: "CEO", access: "كل النظام", route: "/ceo" },
    { role: "Restaurant", access: "طلبات ومنيو وتنبيهات المطعم", route: "/restaurant-admin" },
    { role: "Driver", access: "طلبات السائق والموقع", route: "/driver" },
    { role: "Customer", access: "طلب وتتبع وتقييم", route: "/" },
  ];

  return (
    <Card title="Auth & Roles Matrix" action={<Badge text="Security" color="bg-red-500/15 text-red-300" />}>
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.role} className="grid grid-cols-1 gap-2 rounded-2xl bg-white/5 p-4 text-sm md:grid-cols-3">
            <p className="font-black text-white">{role.role}</p>
            <p className="text-white/55">{role.access}</p>
            <p className="text-[#FF7A00]">{role.route}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RealDataMappingCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const mappings = [
    { ui: "Orders Board", source: "orders", count: orders.length },
    { ui: "Menu Manager", source: "menuItems", count: menu.length },
    { ui: "Alerts Center", source: "notifications", count: alerts.length },
    { ui: "Driver Leaderboard", source: "driversStatus + orders", count: drivers.length },
  ];

  return (
    <Card title="Real Data Mapping Center">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {mappings.map((map) => (
          <div key={map.ui} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{map.ui}</p>
            <p className="mt-1 text-sm text-white/45">Firestore: {map.source}</p>
            <p className="mt-3 text-2xl font-black text-[#FF7A00]">{map.count}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function NotificationPipelineCenter({
  orders,
  alerts,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const pipelines = [
    { title: "New Order Push", target: "Restaurant App", active: orders.length > 0 },
    { title: "Driver Assignment", target: "Driver App", active: orders.some((order) => order.status === "جاهز") },
    { title: "Critical Alerts", target: "CEO Dashboard", active: highAlerts > 0 || urgentOrders > 0 },
    { title: "Customer Tracking", target: "Customer App", active: orders.some((order) => order.status === "قيد التوصيل") },
  ];

  return (
    <Card title="Notification Pipeline Center" action={<Badge text="FCM Ready" color="bg-sky-500/15 text-sky-300" />}>
      <div className="space-y-3">
        {pipelines.map((pipe) => (
          <div key={pipe.title} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
            <div>
              <p className="font-black">{pipe.title}</p>
              <p className="mt-1 text-xs text-white/45">Target: {pipe.target}</p>
            </div>
            <Badge
              text={pipe.active ? "Active" : "Standby"}
              color={pipe.active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/45"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportsExportCenter({
  orders,
  menu,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  totalSales: number;
}) {
  const reports = [
    { title: "Daily Orders PDF", rows: orders.length, type: "PDF" },
    { title: "Menu Performance Excel", rows: menu.length, type: "Excel" },
    { title: "Revenue Summary", rows: totalSales > 0 ? 1 : 0, type: "PDF" },
    { title: "Kitchen Delay Report", rows: orders.filter((order) => order.prepMinutes > 20).length, type: "Excel" },
  ];

  return (
    <Card title="Reports Export Center" action={<Badge text="PDF / Excel" color="bg-purple-500/15 text-purple-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {reports.map((report) => (
          <div key={report.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{report.title}</p>
              <Badge text={report.type} color="bg-[#FF7A00]/15 text-[#FF7A00]" />
            </div>
            <p className="mt-3 text-sm text-white/50">Rows Ready: {report.rows}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function GoLiveChecklist() {
  const checklist = [
    { title: "ربط Firebase Auth", done: false },
    { title: "تحويل Demo Data إلى Firestore", done: false },
    { title: "تفعيل FCM Notifications", done: false },
    { title: "ربط خرائط السائقين", done: false },
    { title: "تقارير PDF/Excel", done: false },
    { title: "حماية الصفحات حسب الدور", done: false },
  ];
  const done = checklist.filter((item) => item.done).length;

  return (
    <Card title="Go Live Checklist" action={<Badge text={`${done}/${checklist.length}`} color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {checklist.map((item) => (
          <div key={item.title} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
            <p className="font-bold">{item.title}</p>
            <Badge
              text={item.done ? "Done" : "Next"}
              color={item.done ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}


function LiveFirestoreDashboard({
  orders,
  alerts,
  menu,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
  menu: MenuItem[];
}) {
  const collections = [
    { name: "orders", docs: orders.length, status: "Live", latency: "42ms" },
    { name: "notifications", docs: alerts.length, status: "Live", latency: "38ms" },
    { name: "ratings", docs: 24, status: "Ready", latency: "51ms" },
    { name: "driversStatus", docs: drivers.length, status: "Live", latency: "36ms" },
    { name: "menuItems", docs: menu.length, status: "Live", latency: "44ms" },
  ];

  return (
    <Card title="Live Firestore Dashboard" action={<Badge text="Real Data Layer" color="bg-green-500/15 text-green-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Collections" value={collections.length} color="text-[#FF7A00]" />
        <MiniStat title="Live Documents" value={collections.reduce((sum, item) => sum + item.docs, 0)} color="text-green-300" />
        <MiniStat title="Sync Status" value="Stable" color="text-sky-300" />
        <MiniStat title="Avg Latency" value="42ms" color="text-yellow-300" />
      </div>

      <div className="space-y-3">
        {collections.map((collection) => (
          <div key={collection.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{collection.name}</p>
                <p className="mt-1 text-xs text-white/45">{collection.docs} docs — latency {collection.latency}</p>
              </div>
              <Badge text={collection.status} color="bg-green-500/15 text-green-300" />
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, collection.docs * 12)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RealChartsCenter({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const revenueBars = [42, 58, 63, 75, 69, 88, 94];
  const orderBars = [orders.length * 12, 36, 52, 68, 44, 78, 86].map((value) => Math.min(100, value));
  const driverBars = drivers.map((driver) => Math.min(100, driver.orders * 5));
  const restaurantBars = branches.map((branch) => Math.min(100, Math.round(branch.sales / 25000)));
  const panels = [
    { title: "Revenue Chart", bars: revenueBars, value: `${totalSales.toLocaleString()} د.ع` },
    { title: "Orders Chart", bars: orderBars, value: `${orders.length} طلب` },
    { title: "Driver Performance", bars: driverBars, value: `${drivers.length} سائق` },
    { title: "Restaurant Performance", bars: restaurantBars, value: `${branches.length} فروع` },
  ];

  return (
    <Card title="Real Charts Center" action={<Badge text="Charts Ready" color="bg-purple-500/15 text-purple-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Revenue" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Orders" value={orders.length} color="text-green-300" />
        <MiniStat title="Menu Items" value={menu.length} color="text-sky-300" />
        <MiniStat title="Alerts" value={alerts.length} color="text-red-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {panels.map((panel) => (
          <div key={panel.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-black">{panel.title}</p>
              <span className="text-xs font-bold text-[#FF7A00]">{panel.value}</span>
            </div>
            <div className="grid h-28 grid-cols-7 items-end gap-2">
              {panel.bars.map((bar, index) => (
                <div key={`${panel.title}-${index}`} className="flex h-full items-end rounded-xl bg-black/70 p-1">
                  <div className="w-full rounded-lg bg-[#FF7A00]" style={{ height: `${bar}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LiveMapsCenter({ orders, branches }: { orders: Order[]; branches: Branch[] }) {
  const zones = [
    { area: "زيونة", x: "72%", y: "34%", orders: orders.filter((order) => order.area === "زيونة").length + 8, heat: 86 },
    { area: "الكرادة", x: "48%", y: "55%", orders: orders.filter((order) => order.area === "الكرادة").length + 6, heat: 72 },
    { area: "المنصور", x: "28%", y: "40%", orders: orders.filter((order) => order.area === "المنصور").length + 5, heat: 64 },
    { area: "الجادرية", x: "55%", y: "72%", orders: orders.filter((order) => order.area === "الجادرية").length + 4, heat: 58 },
  ];

  return (
    <Card title="Live Maps Center" action={<Badge text="Drivers / Heat Zones" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Active Drivers" value={drivers.filter((driver) => driver.online).length} color="text-green-300" />
        <MiniStat title="Heat Zones" value={zones.length} color="text-[#FF7A00]" />
        <MiniStat title="Branches" value={branches.length} color="text-sky-300" />
      </div>

      <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,122,0,0.18),rgba(255,255,255,0.04),rgba(0,0,0,0.8))]">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "34px 34px" }} />
        {zones.map((zone) => (
          <div key={zone.area} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: zone.x, top: zone.y }}>
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#FF7A00]/30 bg-[#FF7A00]/20 text-center shadow-[0_0_35px_rgba(255,122,0,0.25)]">
              <div>
                <p className="text-xs font-black">{zone.area}</p>
                <p className="text-xs text-white/60">{zone.orders} طلب</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RolesPermissionsPro() {
  const roles = [
    { role: "CEO", access: "Full System", level: 100 },
    { role: "Admin", access: "Operations + Finance", level: 88 },
    { role: "Restaurant", access: "Orders + Menu", level: 72 },
    { role: "Driver", access: "Assigned Orders", level: 44 },
    { role: "Customer", access: "Orders + Loyalty", level: 36 },
  ];

  return (
    <Card title="Roles & Permissions Pro" action={<Badge text="RBAC" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.role} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{role.role}</p>
                <p className="mt-1 text-xs text-white/45">{role.access}</p>
              </div>
              <span className="text-lg font-black text-[#FF7A00]">{role.level}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${role.level}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FinancePro({ orders, totalSales }: { orders: Order[]; totalSales: number }) {
  const deliveredSales = orders.filter((order) => order.status === "تم التسليم").reduce((sum, order) => sum + order.amount, 0);
  const commission = Math.round(totalSales * 0.12);
  const expenses = Math.round(totalSales * 0.47);
  const net = totalSales - commission - expenses;
  const cash = orders.filter((order) => order.payment === "كاش").reduce((sum, order) => sum + order.amount, 0);
  const digital = totalSales - cash;

  return (
    <Card title="Finance Pro" action={<Badge text="Live Finance" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="Gross Revenue" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Delivered Revenue" value={`${deliveredSales.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="Commission" value={`${commission.toLocaleString()} د.ع`} color="text-yellow-300" />
        <MiniStat title="Net Profit" value={`${net.toLocaleString()} د.ع`} color={net >= 0 ? "text-green-300" : "text-red-300"} />
      </div>
      <div className="mt-4 rounded-3xl bg-white/5 p-4">
        <div className="mb-2 flex justify-between text-sm"><span>Cash</span><span>{cash.toLocaleString()} د.ع</span></div>
        <div className="mb-4 h-2 overflow-hidden rounded-full bg-black"><div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${totalSales ? Math.round((cash / totalSales) * 100) : 0}%` }} /></div>
        <div className="mb-2 flex justify-between text-sm"><span>Digital</span><span>{digital.toLocaleString()} د.ع</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-black"><div className="h-full rounded-full bg-green-500" style={{ width: `${totalSales ? Math.round((digital / totalSales) * 100) : 0}%` }} /></div>
      </div>
    </Card>
  );
}

function CRMProReal({ customers, orders }: { customers: Customer[]; orders: Order[] }) {
  const vip = customers.filter((customer) => customer.segment === "VIP").length;
  const atRisk = customers.filter((customer) => customer.segment === "At Risk").length;
  const frequent = customers.filter((customer) => customer.segment === "Frequent").length;

  return (
    <Card title="CRM Pro Real" action={<Badge text="Customer Segments" color="bg-purple-500/15 text-purple-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Customers" value={customers.length} color="text-white" />
        <MiniStat title="VIP" value={vip} color="text-[#FF7A00]" />
        <MiniStat title="Frequent" value={frequent} color="text-green-300" />
        <MiniStat title="At Risk" value={atRisk} color="text-red-300" />
      </div>
      <div className="space-y-3">
        {customers.slice(0, 5).map((customer) => (
          <div key={customer.id} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{customer.name}</p>
                <p className="mt-1 text-xs text-white/45">{customer.area} — {customer.orders} طلب — آخر طلب: {customer.lastOrder}</p>
              </div>
              <Badge
                text={customer.segment}
                color={customer.segment === "At Risk" ? "bg-red-500/15 text-red-300" : customer.segment === "VIP" ? "bg-[#FF7A00]/15 text-[#FF7A00]" : "bg-green-500/15 text-green-300"}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        AI CRM: أرسل كوبون رجوع إلى {atRisk} عملاء معرضين للانقطاع، واستهدف VIP بعروض صباحية خاصة. الطلبات الحالية: {orders.length}.
      </p>
    </Card>
  );
}

function AICopilotReal({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const urgent = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const suggestions = [
    urgent > 0 ? `حرّك ${urgent} طلب عاجل إلى أعلى أولوية التشغيل.` : "سرعة الطلبات مستقرة، حافظ على نفس التوزيع.",
    outOfStock > 0 ? `أخفِ ${outOfStock} أصناف نافدة من الواجهة قبل وصول طلبات عليها.` : "توفر المنيو جيد ولا يحتاج إخفاء أصناف.",
    highAlerts > 0 ? `عالج ${highAlerts} تنبيهات عالية قبل الذروة.` : "لا توجد تنبيهات عالية حالياً.",
    totalSales > 80000 ? "فعّل حملة Upsell للطلبات العالية القيمة اليوم." : "ارفع متوسط الطلب بعرض Combo صغير.",
  ];

  return (
    <Card title="AI Copilot Real" action={<Badge text="Data Based" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={suggestion} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-black text-[#FF7A00]">AI Action #{index + 1}</p>
            <p className="mt-2 text-sm text-white/75">{suggestion}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MultiBranchLive({
  branches,
  orders,
  totalSales,
}: {
  branches: Branch[];
  orders: Order[];
  totalSales: number;
}) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const best = [...branches].sort((a, b) => b.sales - a.sales)[0];

  return (
    <Card title="Multi Branch Live" action={<Badge text="Branch Compare" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Branches" value={branches.length} color="text-white" />
        <MiniStat title="Best Branch" value={best?.name || "-"} color="text-[#FF7A00]" />
        <MiniStat title="Today Orders" value={orders.length} color="text-green-300" />
      </div>
      <div className="space-y-3">
        {branches.map((branch) => {
          const share = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;
          return (
            <div key={branch.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">{branch.area} — {branch.orders} طلب — ⭐ {branch.rating}</p>
                </div>
                <Badge
                  text={branch.status}
                  color={branch.status === "ممتاز" ? "bg-green-500/15 text-green-300" : branch.status === "جيد" ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                <span>{branch.sales.toLocaleString()} د.ع</span>
                <span>{share}% من الفروع</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">
        Live Compare: إجمالي مبيعات الفروع {totalBranchSales.toLocaleString()} د.ع، ومبيعات لوحة اليوم {totalSales.toLocaleString()} د.ع.
      </p>
    </Card>
  );
}


function PushNotificationsPro({ orders, alerts }: { orders: Order[]; alerts: RestaurantAlert[] }) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const unresolvedAlerts = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const channels = [
    { title: "New Order Push", value: orders.filter((order) => order.status === "جديد").length, hint: "Firebase topic: restaurant_orders", color: "text-[#FF7A00]" },
    { title: "Urgent Alerts", value: urgentOrders, hint: "High priority notification", color: "text-red-300" },
    { title: "Driver Updates", value: orders.filter((order) => order.status === "جاهز").length, hint: "Ready for pickup", color: "text-sky-300" },
    { title: "Unresolved", value: unresolvedAlerts, hint: "Needs action", color: "text-yellow-300" },
  ];

  return (
    <Card title="Push Notifications Pro" action={<Badge text="FCM Ready" color="bg-green-500/15 text-green-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {channels.map((item) => (
          <MiniStat key={item.title} title={item.title} value={item.value} color={item.color} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {channels.map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{item.title}</p>
            <p className="mt-1 text-xs text-white/45">{item.hint}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.min(100, Number(item.value) * 22 + 20)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        Production Note: اربط هذا المركز مع Firebase Messaging حتى تنرسل إشعارات الطلبات والتنبيهات مباشرة للمطعم والسائقين.
      </p>
    </Card>
  );
}

function PDFReportsCenter({ orders, menu, totalSales }: { orders: Order[]; menu: MenuItem[]; totalSales: number }) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const activeMenu = menu.filter((item) => item.active && !item.outOfStock).length;
  const reports = ["Daily Sales", "Orders Summary", "Menu Performance", "Branch Report"];

  return (
    <Card title="PDF Reports Center" action={<Badge text="Export PDF" color="bg-red-500/15 text-red-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Total Sales" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Delivered" value={delivered} color="text-green-300" />
        <MiniStat title="Active Menu" value={activeMenu} color="text-sky-300" />
        <MiniStat title="Reports" value={reports.length} color="text-white" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <button key={report} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-right font-black hover:bg-white/10">
            📄 {report}
            <p className="mt-2 text-xs font-normal text-white/45">جاهز للربط مع jsPDF أو API Report Service</p>
          </button>
        ))}
      </div>
    </Card>
  );
}

function ExcelExportCenter({ orders, menu, totalSales }: { orders: Order[]; menu: MenuItem[]; totalSales: number }) {
  const rows = [
    { name: "Orders CSV", count: orders.length, hint: "id, customer, status, amount" },
    { name: "Menu CSV", count: menu.length, hint: "name, price, stock, ordersToday" },
    { name: "Revenue CSV", count: totalSales.toLocaleString(), hint: "daily / weekly / monthly" },
    { name: "Alerts CSV", count: "Ready", hint: "audit and operations" },
  ];

  return (
    <Card title="Excel Export Center" action={<Badge text="XLSX Ready" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => (
          <div key={row.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{row.name}</p>
            <p className="mt-2 text-2xl font-black text-[#FF7A00]">{row.count}</p>
            <p className="mt-2 text-xs text-white/45">{row.hint}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">
        Export Pipeline: الخطوة القادمة تربط الأزرار بمكتبة SheetJS حتى ينزل ملف Excel حقيقي من بيانات Firestore.
      </p>
    </Card>
  );
}

function DriverTrackingLive({ orders }: { orders: Order[] }) {
  const trackedDrivers = drivers.map((driver, index) => ({
    ...driver,
    zone: ["زيونة", "الكرادة", "المنصور"][index] || "بغداد",
    activeOrder: orders.find((order) => order.driver === driver.name)?.id || "لا يوجد",
    battery: 92 - index * 11,
  }));

  return (
    <Card title="Driver Tracking Live" action={<Badge text="GPS Live" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Online Drivers" value={trackedDrivers.filter((driver) => driver.online).length} color="text-green-300" />
        <MiniStat title="Active Deliveries" value={orders.filter((order) => order.status === "قيد التوصيل").length} color="text-[#FF7A00]" />
        <MiniStat title="Avg Arrival" value="24 د" color="text-white" />
      </div>
      <div className="space-y-3">
        {trackedDrivers.map((driver) => (
          <div key={driver.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">🚗 {driver.name}</p>
                <p className="mt-1 text-xs text-white/45">{driver.zone} — Order: {driver.activeOrder} — Battery {driver.battery}%</p>
              </div>
              <Badge text={driver.online ? "Live" : "Offline"} color={driver.online ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function KitchenMonitorPro({ orders, menu, alerts, settings }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; settings: Settings }) {
  const preparing = orders.filter((order) => order.status === "قيد التحضير");
  const delayed = orders.filter((order) => order.prepMinutes > settings.prepTime && ["قيد التحضير", "جاهز"].includes(order.status));
  const kitchenAlerts = alerts.filter((alert) => alert.type === "مطبخ" || alert.type === "جودة").length;

  return (
    <Card title="Kitchen Monitor Pro" action={<Badge text="Kitchen Screen" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Preparing" value={preparing.length} color="text-yellow-300" />
        <MiniStat title="Delayed" value={delayed.length} color="text-red-300" />
        <MiniStat title="Prep Target" value={`${settings.prepTime} د`} color="text-[#FF7A00]" />
        <MiniStat title="Kitchen Alerts" value={kitchenAlerts} color="text-white" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {orders.filter((order) => ["جديد", "قيد التحضير", "جاهز"].includes(order.status)).map((order) => (
          <div key={order.id} className="rounded-2xl border border-white/10 bg-black p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{order.id}</p>
              <Badge text={order.status} color={statusAccent(order.status)} />
            </div>
            <p className="mt-2 text-sm text-white/55">{order.items.join("، ")}</p>
            <p className="mt-2 text-xs text-white/35">Prep {order.prepMinutes} د — {order.priority}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        AI Kitchen: {menu.filter((item) => item.outOfStock).length > 0 ? "أخفِ الأصناف النافدة قبل زيادة ضغط الطلبات." : "المخزون الظاهر جيد حالياً."}
      </p>
    </Card>
  );
}

function ForecastAIReal({ orders, menu, alerts, totalSales }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; totalSales: number }) {
  const pressure = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length + alerts.filter((alert) => alert.level === "عالي").length;
  const forecastSales = Math.round(totalSales * (pressure >= 5 ? 1.32 : pressure >= 3 ? 1.18 : 1.08));
  const stockRisk = menu.filter((item) => item.outOfStock || item.ordersToday > 25).length;

  return (
    <Card title="Forecast AI Real" action={<Badge text="Prediction" color="bg-purple-500/15 text-purple-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Next Peak" value="7:30 م" color="text-[#FF7A00]" />
        <MiniStat title="Forecast Sales" value={`${forecastSales.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="Pressure Index" value={`${Math.min(100, pressure * 16)}%`} color="text-yellow-300" />
        <MiniStat title="Stock Risk" value={stockRisk} color="text-red-300" />
      </div>
      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="font-black text-[#FF7A00]">AI Forecast</p>
        <p className="mt-2 text-sm text-white/65">
          التوقع: الطلبات راح تزيد وقت المساء. جهّز أكثر الأصناف مبيعاً وخلّي سائق قريب من مناطق الطلبات الحالية.
        </p>
      </div>
    </Card>
  );
}

function SmartDispatchAI({ orders }: { orders: Order[] }) {
  const readyOrders = orders.filter((order) => order.status === "جاهز");
  const bestDriver = [...drivers].sort((a, b) => b.rating - a.rating || a.orders - b.orders)[0];

  return (
    <Card title="Smart Dispatch AI" action={<Badge text="Auto Assign" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Ready Orders" value={readyOrders.length} color="text-sky-300" />
        <MiniStat title="Best Driver" value={bestDriver?.name || "-"} color="text-[#FF7A00]" />
        <MiniStat title="ETA" value={bestDriver?.speed || "-"} color="text-green-300" />
      </div>
      <div className="space-y-3">
        {(readyOrders.length ? readyOrders : orders.slice(0, 2)).map((order) => (
          <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{order.id} → {order.area}</p>
                <p className="mt-1 text-xs text-white/45">مقترح: {bestDriver?.name} بسبب التقييم والسرعة</p>
              </div>
              <button className="rounded-2xl bg-[#FF7A00] px-4 py-2 text-xs font-black text-black">Assign</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LoyaltyRewardsSystem({ customers, orders }: { customers: Customer[]; orders: Order[] }) {
  const totalPoints = customers.reduce((sum, customer) => sum + customer.orders * 120, 0);
  const vip = customers.filter((customer) => customer.segment === "VIP").length;
  const atRisk = customers.filter((customer) => customer.segment === "At Risk").length;

  return (
    <Card title="Loyalty Rewards System" action={<Badge text="Rewards" color="bg-yellow-500/15 text-yellow-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Total Points" value={totalPoints.toLocaleString()} color="text-[#FF7A00]" />
        <MiniStat title="VIP" value={vip} color="text-green-300" />
        <MiniStat title="At Risk" value={atRisk} color="text-red-300" />
        <MiniStat title="Orders Linked" value={orders.length} color="text-white" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {customers.slice(0, 4).map((customer) => (
          <div key={customer.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="font-black">{customer.name}</p>
              <Badge text={customer.segment} color={customer.segment === "VIP" ? "bg-green-500/15 text-green-300" : customer.segment === "At Risk" ? "bg-red-500/15 text-red-300" : "bg-[#FF7A00]/15 text-[#FF7A00]"} />
            </div>
            <p className="mt-2 text-sm text-white/55">{(customer.orders * 120).toLocaleString()} نقطة — {customer.orders} طلب</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MarketingAutomationPro({ menu, orders, alerts }: { menu: MenuItem[]; orders: Order[]; alerts: RestaurantAlert[] }) {
  const topItem = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];
  const slowItem = [...menu].filter((item) => !item.outOfStock).sort((a, b) => a.ordersToday - b.ordersToday)[0];
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;

  const campaigns = [
    { title: "Breakfast Boost", target: topItem?.name || "Top item", action: "Push at 8:00 AM" },
    { title: "Slow Item Offer", target: slowItem?.name || "Slow item", action: "10% discount" },
    { title: "Win Back Customers", target: "At Risk", action: "Coupon 2,000 د.ع" },
    { title: "Peak Hour Campaign", target: `${orders.length} orders today`, action: highAlerts ? "Pause until stable" : "Activate" },
  ];

  return (
    <Card title="Marketing Automation Pro" action={<Badge text="Campaign AI" color="bg-pink-500/15 text-pink-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <div key={campaign.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">📢 {campaign.title}</p>
            <p className="mt-1 text-xs text-white/45">Target: {campaign.target}</p>
            <p className="mt-3 rounded-xl bg-black px-3 py-2 text-sm text-[#FF7A00]">{campaign.action}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuditSecurityCenter({ orders, alerts }: { orders: Order[]; alerts: RestaurantAlert[] }) {
  const auditLogs = [
    { title: "Order Status Change", count: orders.length, level: "Normal" },
    { title: "Critical Alerts", count: alerts.filter((alert) => alert.level === "عالي").length, level: "High" },
    { title: "Rejected Orders", count: orders.filter((order) => order.status === "مرفوض").length, level: "Review" },
    { title: "Permission Checks", count: 5, level: "Secure" },
  ];

  return (
    <Card title="Audit & Security Center" action={<Badge text="Security" color="bg-red-500/15 text-red-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {auditLogs.map((log) => (
          <div key={log.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/45">{log.title}</p>
            <p className="mt-2 text-2xl font-black text-[#FF7A00]">{log.count}</p>
            <p className="mt-2 text-xs text-white/35">{log.level}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/65">
        Audit Trail: اربط هذا المركز لاحقاً مع collection باسم auditLogs لتسجيل كل تغيير حالة، تعديل سعر، صلاحية، وتسجيل دخول.
      </p>
    </Card>
  );
}

function UserRolesGuard() {
  const roles = [
    { role: "CEO", access: "Full Command", guard: "كل الصلاحيات", status: "Active" },
    { role: "Admin", access: "Operations", guard: "طلبات / مطاعم / سائقين", status: "Active" },
    { role: "Restaurant", access: "Vendor", guard: "طلبات المطعم والمنيو فقط", status: "Ready" },
    { role: "Driver", access: "Delivery", guard: "طلباته وموقعه فقط", status: "Ready" },
    { role: "Customer", access: "Ordering", guard: "طلباته وتقييماته فقط", status: "Ready" },
  ];

  return (
    <Card title="User Roles Guard" action={<Badge text="RBAC" color="bg-sky-500/15 text-sky-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {roles.map((item) => (
          <div key={item.role} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-white">{item.role}</p>
                <p className="mt-1 text-xs text-white/45">{item.access}</p>
              </div>
              <Badge text={item.status} color="bg-green-500/15 text-green-300" />
            </div>
            <p className="mt-3 rounded-xl bg-black px-3 py-2 text-sm text-white/65">{item.guard}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        Production Note: اربط هذا الجزء لاحقاً مع Firebase Auth custom claims أو جدول roles حتى كل صفحة تنفتح حسب صلاحية المستخدم فقط.
      </p>
    </Card>
  );
}

function ActivityLogsPro({ orders, alerts }: { orders: Order[]; alerts: RestaurantAlert[] }) {
  const logs = [
    ...orders.slice(0, 4).map((order) => ({
      title: `تحديث طلب ${order.id}`,
      body: `${order.customer} — الحالة الحالية ${order.status}`,
      time: order.time,
      level: order.priority === "عاجل" ? "High" : "Normal",
    })),
    ...alerts.slice(0, 3).map((alert) => ({
      title: `تنبيه ${alert.type}`,
      body: alert.message,
      time: alert.time,
      level: alert.level,
    })),
  ];

  return (
    <Card title="Activity Logs Pro" action={<Badge text="Audit Trail" color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div key={`${log.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{log.title}</p>
                <p className="mt-1 text-sm text-white/55">{log.body}</p>
              </div>
              <span className="text-xs text-white/35">{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BackupRestoreCenter({ orders, menu, alerts }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[] }) {
  const backupSize = Math.round((orders.length * 3.2 + menu.length * 1.4 + alerts.length * 0.8) * 10) / 10;

  return (
    <Card title="Backup & Restore Center" action={<Badge text="Pre-Launch" color="bg-green-500/15 text-green-300" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Orders Snapshot" value={orders.length} color="text-[#FF7A00]" />
        <MiniStat title="Menu Snapshot" value={menu.length} color="text-green-300" />
        <MiniStat title="Backup Size" value={`${backupSize} MB`} color="text-white" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button className="rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-black text-black">إنشاء نسخة</button>
        <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white">استرجاع نسخة</button>
      </div>
      <p className="mt-4 rounded-2xl bg-white/5 p-4 text-sm text-white/60">
        Production Note: اربط الأزرار لاحقاً مع Cloud Functions لتصدير Firestore إلى Storage واسترجاعه عند الحاجة.
      </p>
    </Card>
  );
}

function ErrorMonitoringCenter({ orders, alerts }: { orders: Order[]; alerts: RestaurantAlert[] }) {
  const critical = alerts.filter((alert) => alert.level === "عالي").length;
  const rejected = orders.filter((order) => order.status === "مرفوض").length;
  const warnings = critical + rejected;

  return (
    <Card title="Error Monitoring Center" action={<Badge text={warnings ? "Needs Review" : "Stable"} color={warnings ? "bg-red-500/15 text-red-300" : "bg-green-500/15 text-green-300"} />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Critical Alerts" value={critical} color="text-red-300" />
        <MiniStat title="Rejected Orders" value={rejected} color="text-yellow-300" />
        <MiniStat title="System Status" value={warnings ? "Review" : "OK"} color={warnings ? "text-[#FF7A00]" : "text-green-300"} />
      </div>
      <div className="mt-4 rounded-2xl bg-black p-4 text-sm text-white/65">
        {warnings ? "يوجد تنبيهات قبل الإطلاق. راجع الطلبات المرفوضة والتنبيهات العالية." : "لا توجد أخطاء حرجة حالياً. النظام جاهز للاختبار النهائي."}
      </div>
    </Card>
  );
}

function PerformanceAnalyticsPro({ orders, menu, alerts, settings }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; settings: Settings }) {
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const loadScore = Math.min(100, activeOrders * 16 + alerts.length * 8 + menu.filter((item) => item.outOfStock).length * 12);
  const speedScore = Math.max(55, 100 - Math.max(0, settings.prepTime - 15) * 3 - activeOrders * 4);

  return (
    <Card title="Performance Analytics Pro" action={<Badge text="System Speed" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="Load Score" value={`${loadScore}%`} color={loadScore > 70 ? "text-red-300" : "text-green-300"} />
        <MiniStat title="Speed Score" value={`${speedScore}%`} color="text-green-300" />
      </div>
      <div className="mt-4 space-y-3">
        {[{ title: "واجهة المطعم", value: speedScore }, { title: "ضغط الطلبات", value: loadScore }, { title: "استقرار البيانات", value: 94 }].map((item) => (
          <div key={item.title}>
            <div className="mb-1 flex justify-between text-xs text-white/45"><span>{item.title}</span><span>{item.value}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${item.value}%` }} /></div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BranchComparisonPro({ branches, orders }: { branches: Branch[]; orders: Order[] }) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);

  return (
    <Card title="Branch Comparison Pro" action={<Badge text="Branches" color="bg-blue-500/15 text-blue-300" />}>
      <div className="space-y-3">
        {branches.map((branch) => {
          const share = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;
          return (
            <div key={branch.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">{branch.area} — {branch.orders} طلب — ⭐ {branch.rating}</p>
                </div>
                <Badge text={branch.status} color={branch.status === "ممتاز" ? "bg-green-500/15 text-green-300" : branch.status === "جيد" ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} /></div>
              <p className="mt-2 text-xs text-white/45">حصة المبيعات: {share}% — طلبات الصفحة الحالية: {orders.length}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RevenueForecastAI({ orders, totalSales, branches }: { orders: Order[]; totalSales: number; branches: Branch[] }) {
  const averageOrder = orders.length ? Math.round(totalSales / orders.length) : 0;
  const tomorrowOrders = Math.max(orders.length + 7, Math.round(orders.length * 1.28));
  const tomorrowRevenue = tomorrowOrders * averageOrder;
  const weeklyForecast = Math.round((totalSales + branches.reduce((sum, branch) => sum + branch.sales, 0) * 0.05) * 1.18);

  return (
    <Card title="Revenue Forecast AI" action={<Badge text="Forecast" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="غداً" value={`${tomorrowRevenue.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="طلبات متوقعة" value={tomorrowOrders} color="text-green-300" />
        <MiniStat title="أسبوعياً" value={`${weeklyForecast.toLocaleString()} د.ع`} color="text-white" />
      </div>
      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        AI: إذا فعّلت عرض فطور خفيف قبل الذروة، التوقع يزيد تقريباً 12% حسب حركة الطلبات الحالية.
      </p>
    </Card>
  );
}

function GoLiveControlCenter({ orders, menu, alerts, restaurantOpen }: { orders: Order[]; menu: MenuItem[]; alerts: RestaurantAlert[]; restaurantOpen: boolean }) {
  const checks = [
    { title: "Orders Flow", ready: orders.length > 0 },
    { title: "Menu Active", ready: menu.some((item) => item.active && !item.outOfStock) },
    { title: "Critical Alerts", ready: alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل").length === 0 },
    { title: "Restaurant Status", ready: restaurantOpen },
  ];
  const readyCount = checks.filter((check) => check.ready).length;
  const readiness = Math.round((readyCount / checks.length) * 100);

  return (
    <Card title="Go Live Control Center" action={<Badge text={`${readiness}% Ready`} color={readiness >= 80 ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"} />}>
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${readiness}%` }} /></div>
      <div className="space-y-2">
        {checks.map((check) => (
          <div key={check.title} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <span>{check.title}</span>
            <span className={check.ready ? "text-green-300" : "text-red-300"}>{check.ready ? "جاهز" : "ناقص"}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReleaseManagerPro() {
  const releases = [
    { version: "v0.9.7", title: "Restaurant Vendor Ultra", status: "Stable" },
    { version: "v0.9.8", title: "Production Architecture", status: "Testing" },
    { version: "v1.0.0", title: "FUSE Launch Candidate", status: "Next" },
  ];

  return (
    <Card title="Release Manager Pro" action={<Badge text="Versioning" color="bg-white/10 text-white" />}>
      <div className="space-y-3">
        {releases.map((release) => (
          <div key={release.version} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{release.version}</p>
                <p className="mt-1 text-xs text-white/45">{release.title}</p>
              </div>
              <Badge text={release.status} color={release.status === "Stable" ? "bg-green-500/15 text-green-300" : release.status === "Testing" ? "bg-yellow-500/15 text-yellow-300" : "bg-[#FF7A00]/15 text-[#FF7A00]"} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function V1LaunchChecklist() {
  const checklist = [
    "تثبيت Firebase Auth والصلاحيات",
    "ربط Firestore Collections الحقيقية",
    "اختبار إرسال الطلب من الزبون إلى المطعم",
    "اختبار قبول الطلب وتحديث الحالة",
    "اختبار السائق والتتبع",
    "تجهيز Privacy Policy وروابط المتجر",
    "اختبار Android build وAAB",
    "تجهيز صور Google Play وApple Store",
  ];

  return (
    <Card title="V1 Launch Checklist" action={<Badge text="Launch Ready" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-2">
        {checklist.map((item, index) => (
          <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF7A00] text-xs font-black text-black">{index + 1}</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-green-500/10 p-4 text-sm text-green-200">
        بعد إكمال هذه القائمة، نبدأ بفصل Customer App / Driver App / Restaurant App / CEO Dashboard كمسارات إنتاجية مستقلة.
      </p>
    </Card>
  );
}



function V11ProductionCoreCenter({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const collections = [
    { name: "orders", count: orders.length, status: "Ready" },
    { name: "notifications", count: alerts.length + orders.length, status: "Ready" },
    { name: "ratings", count: initialCustomers.length, status: "Schema" },
    { name: "driversStatus", count: drivers.length, status: "Ready" },
    { name: "restaurants", count: branches.length, status: "Ready" },
  ];

  return (
    <Card
      title="FUSE V1.1 Production Core"
      action={<Badge text="Live Data Layer" color="bg-green-500/15 text-green-300" />}
    >
      <div className="mb-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4">
        <p className="text-sm text-white/55">Production Mode</p>
        <h3 className="mt-2 text-2xl font-black text-white">
          بداية ربط FUSE بالبيانات الحقيقية بدل الداتا التجريبية
        </h3>
        <p className="mt-2 text-sm text-white/60">
          هذا الجزء يجهز لوحة التشغيل للربط مع Firestore Collections، صلاحيات المستخدمين، المراقبة الحية، والتنبيهات.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Collections" value={collections.length} color="text-[#FF7A00]" />
        <MiniStat title="Data Records" value={collections.reduce((sum, item) => sum + item.count, 0)} color="text-green-300" />
        <MiniStat title="Revenue Stream" value={`${totalSales.toLocaleString()} د.ع`} color="text-white" />
      </div>

      <div className="mt-4 space-y-2">
        {collections.map((collection) => (
          <div key={collection.name} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <div>
              <p className="font-black text-white">{collection.name}</p>
              <p className="text-xs text-white/40">{collection.count} record mapped</p>
            </div>
            <Badge
              text={collection.status}
              color={collection.status === "Ready" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function LiveOrdersDashboardV11({
  orders,
  totalSales,
}: {
  orders: Order[];
  totalSales: number;
}) {
  const newOrders = orders.filter((order) => order.status === "جديد").length;
  const preparing = orders.filter((order) => order.status === "قيد التحضير").length;
  const ready = orders.filter((order) => order.status === "جاهز").length;
  const delivering = orders.filter((order) => order.status === "قيد التوصيل").length;
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const active = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;

  const liveCards = [
    { title: "جديدة", value: newOrders, color: "text-[#FF7A00]" },
    { title: "قيد التحضير", value: preparing, color: "text-yellow-300" },
    { title: "جاهزة", value: ready, color: "text-sky-300" },
    { title: "قيد التوصيل", value: delivering, color: "text-purple-300" },
    { title: "مكتملة", value: delivered, color: "text-green-300" },
  ];

  return (
    <Card title="Live Firestore Dashboard" action={<Badge text="onSnapshot Ready" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات نشطة" value={active} color="text-yellow-300" />
        <MiniStat title="إجمالي الطلبات" value={orders.length} color="text-white" />
        <MiniStat title="إيراد مباشر" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
        {liveCards.map((card) => (
          <div key={card.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-white/45">{card.title}</p>
            <p className={`mt-2 text-3xl font-black ${card.color}`}>{card.value}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${orders.length ? Math.max(8, Math.round((card.value / orders.length) * 100)) : 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-green-500/10 p-4 text-sm text-green-200">
        جاهز للربط الحقيقي: استبدل initialOrders بـ onSnapshot(collection(db, "orders")) حتى تصير الأرقام مباشرة من Firebase.
      </p>
    </Card>
  );
}

function AuthenticationRolesV11() {
  const roles = [
    { role: "CEO", scope: "كل النظام", guard: "full_access", color: "text-[#FF7A00]" },
    { role: "Admin", scope: "العمليات والدعم", guard: "admin_panel", color: "text-yellow-300" },
    { role: "Restaurant", scope: "طلبات ومنيو المطعم", guard: "restaurant_id", color: "text-green-300" },
    { role: "Driver", scope: "طلبات السائق والتتبع", guard: "driver_id", color: "text-sky-300" },
    { role: "Customer", scope: "طلباتي وعناويني", guard: "customer_id", color: "text-purple-300" },
  ];

  return (
    <Card title="Authentication + Roles V1.1" action={<Badge text="RBAC" color="bg-purple-500/15 text-purple-300" />}>
      <div className="space-y-3">
        {roles.map((role) => (
          <div key={role.role} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-lg font-black ${role.color}`}>{role.role}</p>
                <p className="mt-1 text-xs text-white/45">{role.scope}</p>
              </div>
              <Badge text={role.guard} color="bg-white/10 text-white/60" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RechartsReadyCenterV11({
  orders,
  menu,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  totalSales: number;
}) {
  const revenueSeries = [32, 44, 38, 61, 58, 76, 84, 71];
  const orderSeries = ORDER_STATUSES.map((status) => ({
    status,
    value: orders.filter((order) => order.status === status).length,
  }));
  const maxOrders = Math.max(1, ...orderSeries.map((item) => item.value));

  return (
    <Card title="Real Charts Center" action={<Badge text="Recharts Ready" color="bg-sky-500/15 text-sky-300" />}>
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="Revenue Dataset" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Orders Dataset" value={orders.length} color="text-green-300" />
        <MiniStat title="Menu Dataset" value={menu.length} color="text-white" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm font-black text-white">Revenue Chart Preview</p>
        <div className="grid h-32 grid-cols-8 items-end gap-2">
          {revenueSeries.map((value, index) => (
            <div key={index} className="rounded-xl bg-[#FF7A00]" style={{ height: `${value}%` }} />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {orderSeries.map((item) => (
          <div key={item.status}>
            <div className="mb-1 flex justify-between text-xs text-white/50">
              <span>{item.status}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${Math.max(8, Math.round((item.value / maxOrders) * 100))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LiveNotificationsV11({
  orders,
  alerts,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const notifications = [
    ...orders.slice(0, 3).map((order) => ({
      id: `order-${order.id}`,
      title: `طلب ${order.id}`,
      body: `${order.customer} — ${order.status} — ${order.amount.toLocaleString()} د.ع`,
      type: "orders",
      time: order.time,
    })),
    ...alerts.slice(0, 3).map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      body: alert.message,
      type: alert.type,
      time: alert.time,
    })),
  ];

  return (
    <Card title="Live Notifications Center" action={<Badge text="Firestore Feed" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-white">{item.title}</p>
                <p className="mt-1 text-sm text-white/55">{item.body}</p>
              </div>
              <div className="text-left">
                <Badge text={item.type} color="bg-[#FF7A00]/15 text-[#FF7A00]" />
                <p className="mt-2 text-xs text-white/35">{item.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function OrdersMonitorProV11({
  orders,
  updateOrder,
}: {
  orders: Order[];
  updateOrder: (id: string, status: Status) => void;
}) {
  return (
    <Card title="Orders Monitor Pro V1.1" action={<Badge text="Live Control" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}>
      <div className="space-y-3">
        {orders.map((order) => {
          const next = nextStatus(order.status);
          return (
            <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-black text-white">{order.id} — {order.customer}</p>
                  <p className="mt-1 text-xs text-white/45">{order.area} — {order.driver} — {order.payment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge text={order.status} color={statusAccent(order.status)} />
                  {next && (
                    <button onClick={() => updateOrder(order.id, next)} className="rounded-2xl bg-[#FF7A00] px-4 py-2 text-xs font-black text-black">
                      {next}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DriversStatusMonitorV11({ orders }: { orders: Order[] }) {
  const activeDriverNames = new Set(orders.filter((order) => order.driver !== "غير محدد").map((order) => order.driver));

  return (
    <Card title="Drivers Status Monitor" action={<Badge text="driversStatus" color="bg-green-500/15 text-green-300" />}>
      <div className="space-y-3">
        {drivers.map((driver) => {
          const assigned = orders.filter((order) => order.driver === driver.name && order.status !== "تم التسليم").length;
          return (
            <div key={driver.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">{driver.name}</p>
                  <p className="mt-1 text-xs text-white/45">طلبات اليوم {driver.orders} — سرعة {driver.speed}</p>
                </div>
                <div className="text-left">
                  <Badge text={driver.online ? "Online" : "Offline"} color={driver.online ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />
                  <p className="mt-2 text-xs text-white/45">نشط: {activeDriverNames.has(driver.name) ? assigned : 0}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RestaurantsStatusCenterV11({
  branches,
  restaurantOpen,
}: {
  branches: Branch[];
  restaurantOpen: boolean;
}) {
  return (
    <Card title="Restaurants Status Center" action={<Badge text={restaurantOpen ? "Open" : "Closed"} color={restaurantOpen ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300"} />}>
      <div className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black text-white">{branch.name}</p>
                <p className="mt-1 text-xs text-white/45">{branch.area} — {branch.orders} طلب — ⭐ {branch.rating}</p>
              </div>
              <div className="text-left">
                <p className="font-black text-[#FF7A00]">{branch.sales.toLocaleString()} د.ع</p>
                <Badge text={branch.status} color={branch.status === "ممتاز" ? "bg-green-500/15 text-green-300" : branch.status === "جيد" ? "bg-yellow-500/15 text-yellow-300" : "bg-red-500/15 text-red-300"} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


function GoogleMapsLiveCenter({
  orders,
  branches,
}: {
  orders: Order[];
  branches: Branch[];
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  );
  const zones = [
    { name: "زيونة", load: 82, drivers: 6, eta: "18 د" },
    { name: "الكرادة", load: 68, drivers: 4, eta: "22 د" },
    { name: "المنصور", load: 54, drivers: 3, eta: "26 د" },
    { name: "الجادرية", load: 39, drivers: 2, eta: "31 د" },
  ];

  return (
    <Card
      title="Google Maps Live Center"
      action={
        <Badge
          text="Map Ready"
          color="bg-[#FF7A00]/15 text-[#FF7A00]"
        />
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات على الخريطة" value={activeOrders.length} color="text-[#FF7A00]" />
        <MiniStat title="فروع مراقبة" value={branches.length} color="text-green-300" />
        <MiniStat title="Heat Zones" value={zones.length} color="text-yellow-300" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black p-4">
        <div className="absolute left-6 top-6 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          Live Drivers
        </div>

        <div className="grid min-h-[240px] grid-cols-2 gap-3 md:grid-cols-4">
          {zones.map((zone, index) => (
            <div
              key={zone.name}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-4"
            >
              <div>
                <p className="font-black">{zone.name}</p>
                <p className="mt-1 text-xs text-white/40">
                  {zone.drivers} سائق — ETA {zone.eta}
                </p>
              </div>

              <div className="mt-8">
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${
                      index === 0
                        ? "bg-red-500"
                        : index === 1
                        ? "bg-[#FF7A00]"
                        : index === 2
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${zone.load}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-white/45">ضغط المنطقة {zone.load}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🗺️ ملاحظة إنتاجية: هذا المركز جاهز للربط مع Google Maps API وسحب مواقع السائقين من driversStatus.
      </p>
    </Card>
  );
}

function DriverTrackingLivePro({ orders }: { orders: Order[] }) {
  const tracked = orders
    .filter((order) => order.status === "قيد التوصيل" || order.status === "جاهز")
    .map((order, index) => ({
      ...order,
      eta: `${18 + index * 4} د`,
      distance: `${2.4 + index * 1.3} كم`,
      signal: index % 2 === 0 ? "قوي" : "متوسط",
    }));

  return (
    <Card
      title="Driver Tracking Live Pro"
      action={<Badge text="GPS Live" color="bg-green-500/15 text-green-300" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات تتبع" value={tracked.length} color="text-[#FF7A00]" />
        <MiniStat title="متوسط الوصول" value="24 د" color="text-green-300" />
        <MiniStat title="تنبيهات مسار" value="1" color="text-yellow-300" />
      </div>

      <div className="space-y-3">
        {tracked.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-sm text-white/40">
            لا توجد طلبات قيد التتبع حالياً
          </div>
        )}

        {tracked.map((order) => (
          <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{order.id} — {order.driver}</p>
                <p className="mt-1 text-xs text-white/45">
                  {order.area} — {order.customer} — {order.distance}
                </p>
              </div>
              <Badge
                text={`ETA ${order.eta}`}
                color="bg-[#FF7A00]/15 text-[#FF7A00]"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-black p-3">
                <p className="text-white/35">الحالة</p>
                <p className="mt-1 font-black text-white">{order.status}</p>
              </div>
              <div className="rounded-2xl bg-black p-3">
                <p className="text-white/35">الإشارة</p>
                <p className="mt-1 font-black text-green-300">{order.signal}</p>
              </div>
              <div className="rounded-2xl bg-black p-3">
                <p className="text-white/35">المبلغ</p>
                <p className="mt-1 font-black text-[#FF7A00]">{order.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FirebaseMessagingPro({
  orders,
  alerts,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const notifications = [
    {
      title: "طلب جديد",
      body: `${orders.filter((order) => order.status === "جديد").length} طلب جديد يحتاج قبول.`,
      type: "Orders",
      color: "bg-[#FF7A00]/15 text-[#FF7A00]",
    },
    {
      title: "تنبيه عالي",
      body: `${alerts.filter((alert) => alert.level === "عالي").length} تنبيه عالي يحتاج متابعة.`,
      type: "Alerts",
      color: "bg-red-500/15 text-red-300",
    },
    {
      title: "رسائل السائقين",
      body: "قناة FCM جاهزة لإرسال إشعارات للسائقين والمطاعم.",
      type: "FCM",
      color: "bg-green-500/15 text-green-300",
    },
  ];

  return (
    <Card
      title="Firebase Messaging Pro"
      action={<Badge text="FCM Pipeline" color="bg-green-500/15 text-green-300" />}
    >
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{item.title}</p>
                <p className="mt-1 text-sm text-white/55">{item.body}</p>
              </div>
              <Badge text={item.type} color={item.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-black p-4 text-xs text-white/50">
        جاهز للربط مع Firebase Messaging عبر token لكل مستخدم وقنوات: orders / drivers / restaurants.
      </div>
    </Card>
  );
}

function PDFExportPro({
  orders,
  menu,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  totalSales: number;
}) {
  return (
    <Card title="PDF Export Pro">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="طلبات التقرير" value={orders.length} color="text-[#FF7A00]" />
        <MiniStat title="أصناف التقرير" value={menu.length} color="text-yellow-300" />
        <MiniStat title="إجمالي التقرير" value={`${totalSales.toLocaleString()} د.ع`} color="text-green-300" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {["تقرير يومي PDF", "تقرير أسبوعي PDF", "تقرير شهري PDF"].map((label) => (
          <button
            key={label}
            className="rounded-2xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 px-4 py-3 text-sm font-black text-[#FF7A00]"
          >
            {label}
          </button>
        ))}
      </div>
    </Card>
  );
}

function ExcelExportPro({
  orders,
  menu,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  totalSales: number;
}) {
  const sheets = [
    { name: "Orders Sheet", rows: orders.length },
    { name: "Menu Sheet", rows: menu.length },
    { name: "Finance Sheet", rows: 12 },
  ];

  return (
    <Card title="Excel Export Pro">
      <div className="mb-4 rounded-2xl bg-green-500/10 p-4 text-sm text-green-200">
        📈 التصدير جاهز للربط مع XLSX لاحقاً — المبيعات الحالية: {totalSales.toLocaleString()} د.ع
      </div>

      <div className="space-y-3">
        {sheets.map((sheet) => (
          <div key={sheet.name} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
            <div>
              <p className="font-black">{sheet.name}</p>
              <p className="text-xs text-white/40">{sheet.rows} صف جاهز للتصدير</p>
            </div>
            <button className="rounded-xl bg-[#FF7A00] px-3 py-2 text-xs font-black text-black">
              Export
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AICopilotRealPro({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const outOfStock = menu.filter((item) => item.outOfStock).length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;

  const insights = [
    urgentOrders
      ? `عالج ${urgentOrders} طلب عاجل قبل قبول طلبات جديدة حتى تحافظ على التقييم.`
      : "لا توجد طلبات عاجلة؛ استغل الوقت بتحديث المنيو والعروض.",
    outOfStock
      ? `يوجد ${outOfStock} صنف نافد؛ إخفاؤه الآن يقلل الإلغاءات.`
      : "المخزون الظاهر للزبائن مستقر حالياً.",
    highAlerts
      ? `يوجد ${highAlerts} تنبيه عالي؛ الأفضل حلّه قبل ساعة الذروة.`
      : "التنبيهات الحرجة تحت السيطرة.",
    `الإيراد الحالي ${totalSales.toLocaleString()} د.ع، فرصة رفعه بعرض خفيف على الأصناف الأعلى طلباً.`,
  ];

  return (
    <Card
      title="AI Copilot Real Pro"
      action={<Badge text="Data Based" color="bg-purple-500/15 text-purple-300" />}
    >
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-white/70">🤖 {insight}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function MultiBranchLivePro({
  branches,
  orders,
  totalSales,
}: {
  branches: Branch[];
  orders: Order[];
  totalSales: number;
}) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);

  return (
    <Card title="Multi Branch Live Pro">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MiniStat title="الفروع" value={branches.length} color="text-[#FF7A00]" />
        <MiniStat title="طلبات النظام" value={orders.length} color="text-yellow-300" />
        <MiniStat title="مبيعات مباشرة" value={`${totalSales.toLocaleString()} د.ع`} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {branches.map((branch) => {
          const share = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;

          return (
            <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {branch.area} — {branch.orders} طلب — ⭐ {branch.rating}
                  </p>
                </div>
                <Badge
                  text={branch.status}
                  color={
                    branch.status === "ممتاز"
                      ? "bg-green-500/15 text-green-300"
                      : branch.status === "جيد"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-red-500/15 text-red-300"
                  }
                />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${share}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/40">
                حصة الفرع {share}% — {branch.sales.toLocaleString()} د.ع
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SmartDispatchAIReal({ orders }: { orders: Order[] }) {
  const candidates = orders
    .filter((order) => order.status === "جاهز" || order.status === "جديد")
    .map((order, index) => ({
      order,
      driver: drivers[index % drivers.length],
      score: 94 - index * 7,
      reason: index === 0 ? "أقرب سائق وأعلى تقييم" : "مسار مناسب وضغط متوسط",
    }));

  return (
    <Card
      title="Smart Dispatch AI Real"
      action={<Badge text="Auto Assign" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}
    >
      <div className="space-y-3">
        {candidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-sm text-white/40">
            لا توجد طلبات جاهزة للتوزيع الآن
          </div>
        )}

        {candidates.map(({ order, driver, score, reason }) => (
          <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{order.id} → {driver.name}</p>
                <p className="mt-1 text-xs text-white/45">
                  {order.area} — ⭐ {driver.rating} — {reason}
                </p>
              </div>
              <Badge text={`${score}%`} color="bg-green-500/15 text-green-300" />
            </div>

            <button className="mt-4 w-full rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-black text-black">
              اعتماد التوزيع المقترح
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ExecutiveAnalyticsPro({
  orders,
  menu,
  alerts,
  totalSales,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
}) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const completion = orders.length ? Math.round((delivered / orders.length) * 100) : 0;
  const activeMenu = menu.filter((item) => item.active && !item.outOfStock).length;
  const risk = alerts.filter((alert) => alert.level === "عالي").length + orders.filter((order) => order.priority === "عاجل").length;

  return (
    <Card title="Executive Analytics Pro">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MiniStat title="Revenue" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="Completion" value={`${completion}%`} color="text-green-300" />
        <MiniStat title="Active Menu" value={`${activeMenu}/${menu.length}`} color="text-yellow-300" />
        <MiniStat title="Risk Index" value={risk} color={risk > 2 ? "text-red-300" : "text-green-300"} />
      </div>

      <div className="mt-4 rounded-2xl bg-black p-4 text-sm text-white/60">
        Executive Summary: الأداء التشغيلي جيد، والتركيز الآن على سرعة التوصيل وتقليل التنبيهات العالية.
      </div>
    </Card>
  );
}

function SecurityCenterPro({
  orders,
  alerts,
}: {
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const logs = [
    {
      title: "Order Status Update",
      body: `${orders.length} طلب تحت المراقبة مع صلاحيات تحديث الحالة.`,
      level: "Info",
    },
    {
      title: "Critical Alerts",
      body: `${alerts.filter((alert) => alert.level === "عالي").length} تنبيه عالي ضمن سجل الأمان.`,
      level: "High",
    },
    {
      title: "Roles Guard",
      body: "صلاحيات CEO/Admin/Restaurant/Driver/Customer جاهزة للتفعيل.",
      level: "Secure",
    },
  ];

  return (
    <Card
      title="Security Center Pro"
      action={<Badge text="Audit Ready" color="bg-green-500/15 text-green-300" />}
    >
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{log.title}</p>
                <p className="mt-1 text-sm text-white/55">{log.body}</p>
              </div>
              <Badge
                text={log.level}
                color={
                  log.level === "High"
                    ? "bg-red-500/15 text-red-300"
                    : log.level === "Secure"
                    ? "bg-green-500/15 text-green-300"
                    : "bg-white/10 text-white/55"
                }
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DriverOrdersCenter({
  orders,
  updateOrder,
}: {
  orders: Order[];
  updateOrder: (id: string, status: Status) => void;
}) {
  const driverOrders = orders.filter(
    (order) => order.driver !== "غير محدد" && order.status !== "مرفوض"
  );

  const readyOrders = orders.filter((order) => order.status === "جاهز");
  const deliveringOrders = orders.filter(
    (order) => order.status === "قيد التوصيل"
  );
  const completedOrders = orders.filter(
    (order) => order.status === "تم التسليم"
  );

  return (
    <Card
      title="Driver Orders Center V1.2"
      action={<Badge text="Driver App" color="bg-[#FF7A00]/15 text-[#FF7A00]" />}
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="جاهزة للاستلام" value={readyOrders.length} color="text-sky-300" />
        <MiniStat title="قيد التوصيل" value={deliveringOrders.length} color="text-purple-300" />
        <MiniStat title="مكتملة" value={completedOrders.length} color="text-green-300" />
        <MiniStat title="طلبات السائقين" value={driverOrders.length} color="text-[#FF7A00]" />
      </div>

      <div className="space-y-3">
        {driverOrders.slice(0, 6).map((order) => {
          const canStart = order.status === "جاهز";
          const canFinish = order.status === "قيد التوصيل";

          return (
            <div key={`driver-${order.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{order.id} — {order.customer}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {order.area} — السائق: {order.driver} — {order.payment}
                  </p>
                </div>
                <Badge text={order.status} color={statusAccent(order.status)} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">قيمة الطلب</p>
                  <p className="mt-1 font-black text-[#FF7A00]">{order.amount.toLocaleString()} د.ع</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">ETA</p>
                  <p className="mt-1 font-black">{Math.max(12, order.prepMinutes + 8)} د</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الأولوية</p>
                  <p className="mt-1 font-black">{order.priority}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">العناصر</p>
                  <p className="mt-1 font-black">{order.items.length}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  disabled={!canStart}
                  onClick={() => updateOrder(order.id, "قيد التوصيل")}
                  className={`rounded-2xl px-3 py-3 text-xs font-black ${
                    canStart ? "bg-[#FF7A00] text-black" : "bg-white/10 text-white/30"
                  }`}
                >
                  استلام الطلب
                </button>
                <button
                  disabled={!canFinish}
                  onClick={() => updateOrder(order.id, "تم التسليم")}
                  className={`rounded-2xl px-3 py-3 text-xs font-black ${
                    canFinish ? "bg-green-500 text-black" : "bg-white/10 text-white/30"
                  }`}
                >
                  تم التسليم
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DriverEarningsCenter({ orders }: { orders: Order[] }) {
  const delivered = orders.filter((order) => order.status === "تم التسليم");
  const todayEarnings = delivered.reduce(
    (sum, order) => sum + Math.max(2500, Math.round(order.amount * 0.12)),
    0
  );
  const weeklyEarnings = todayEarnings * 6;
  const monthlyEarnings = todayEarnings * 26;
  const average = delivered.length ? Math.round(todayEarnings / delivered.length) : 0;

  return (
    <Card title="Driver Earnings Center V1.2">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="أرباح اليوم" value={`${todayEarnings.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="أرباح الأسبوع" value={`${weeklyEarnings.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="أرباح الشهر" value={`${monthlyEarnings.toLocaleString()} د.ع`} color="text-sky-300" />
        <MiniStat title="متوسط الطلب" value={`${average.toLocaleString()} د.ع`} color="text-white" />
      </div>

      <div className="mt-4 rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-4 text-sm text-white/70">
        🧠 AI: إذا زاد عدد الطلبات الجاهزة، النظام يرفع أولوية أقرب سائق ويحسب الربح المتوقع تلقائياً.
      </div>
    </Card>
  );
}

function DriverHistoryCenter({ orders }: { orders: Order[] }) {
  const history = orders
    .filter((order) => ["تم التسليم", "قيد التوصيل"].includes(order.status))
    .map((order, index) => ({
      ...order,
      distance: `${(3.2 + index * 1.1).toFixed(1)} كم`,
      deliveryTime: `${Math.max(18, order.prepMinutes + 10)} د`,
    }));

  return (
    <Card title="Driver History Center V1.2">
      <div className="space-y-3">
        {history.map((order) => (
          <div key={`history-${order.id}`} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{order.id} — {order.area}</p>
                <p className="mt-1 text-xs text-white/45">
                  {order.driver} — {order.deliveryTime} — {order.distance}
                </p>
              </div>
              <Badge
                text={order.status}
                color={order.status === "تم التسليم" ? "bg-green-500/15 text-green-300" : "bg-purple-500/15 text-purple-300"}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DriverRatingsCenter({ orders }: { orders: Order[] }) {
  const delivered = orders.filter((order) => order.status === "تم التسليم").length;
  const rating = delivered >= 3 ? 4.9 : delivered >= 1 ? 4.7 : 4.6;
  const comments = [
    "السائق وصل بسرعة والتعامل ممتاز.",
    "التغليف وصل مرتب والطلب حار.",
    "يفضل تحسين الاتصال قبل الوصول للعنوان.",
  ];

  return (
    <Card title="Driver Ratings Center V1.2">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="متوسط التقييم" value={`${rating}/5`} color="text-[#FF7A00]" />
        <MiniStat title="طلبات مقيمة" value={delivered} color="text-green-300" />
        <MiniStat title="رضا العملاء" value="94%" color="text-sky-300" />
        <MiniStat title="ملاحظات" value={comments.length} color="text-white" />
      </div>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <div key={comment} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">تعليق #{index + 1}</p>
            <p className="mt-1 text-sm text-white/60">{comment}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DriverOnlineControlCenter({ orders }: { orders: Order[] }) {
  const [online, setOnline] = useState(true);
  const activeOrders = orders.filter(
    (order) => order.status === "جاهز" || order.status === "قيد التوصيل"
  ).length;
  const completed = orders.filter((order) => order.status === "تم التسليم").length;

  return (
    <Card
      title="Driver Online Control Center V1.2"
      action={
        <button
          onClick={() => setOnline(!online)}
          className={`rounded-2xl px-4 py-2 text-xs font-black ${
            online ? "bg-green-500 text-black" : "bg-red-500 text-white"
          }`}
        >
          {online ? "Online" : "Offline"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="حالة السائق" value={online ? "متصل" : "غير متصل"} color={online ? "text-green-300" : "text-red-300"} />
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-[#FF7A00]" />
        <MiniStat title="مكتملة" value={completed} color="text-green-300" />
        <MiniStat title="سرعة التوصيل" value="24 د" color="text-sky-300" />
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/65">
        حالة الإنتاج: تتبع السائق، الأرباح، التقييم، وسجل التوصيل جاهزة للربط مع Firestore و GPS Live.
      </div>
    </Card>
  );
}



function RestaurantOrdersCenter({
  orders,
  updateOrder,
}: {
  orders: Order[];
  updateOrder: (id: string, status: Status) => void;
}) {
  const liveOrders = orders.filter((order) => order.status !== "مرفوض");
  const newOrders = liveOrders.filter((order) => order.status === "جديد");
  const preparing = liveOrders.filter((order) => order.status === "قيد التحضير");
  const ready = liveOrders.filter((order) => order.status === "جاهز");
  const delivered = liveOrders.filter((order) => order.status === "تم التسليم");

  return (
    <Card
      title="Restaurant Orders Center V1.2"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Restaurant App
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات جديدة" value={newOrders.length} color="text-[#FF7A00]" />
        <MiniStat title="قيد التحضير" value={preparing.length} color="text-yellow-300" />
        <MiniStat title="جاهزة" value={ready.length} color="text-sky-300" />
        <MiniStat title="مكتملة" value={delivered.length} color="text-green-300" />
      </div>

      <div className="space-y-3">
        {liveOrders.slice(0, 6).map((order) => {
          const next = nextStatus(order.status);

          return (
            <div key={order.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black">{order.id} — {order.customer}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {order.area} — {order.items.join("، ")}
                  </p>
                </div>

                <Badge
                  text={order.status}
                  color={
                    order.status === "تم التسليم"
                      ? "bg-green-500/15 text-green-300"
                      : order.status === "جاهز"
                      ? "bg-sky-500/15 text-sky-300"
                      : order.status === "قيد التحضير"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-[#FF7A00]/15 text-[#FF7A00]"
                  }
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">القيمة</p>
                  <p className="mt-1 font-black text-[#FF7A00]">{order.amount.toLocaleString()} د.ع</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">التحضير</p>
                  <p className="mt-1 font-black">{order.prepMinutes} د</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الدفع</p>
                  <p className="mt-1 font-black">{order.payment}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-white/35">الأولوية</p>
                  <p className="mt-1 font-black">{order.priority}</p>
                </div>
              </div>

              {next && (
                <button
                  onClick={() => updateOrder(order.id, next)}
                  className="mt-3 w-full rounded-2xl bg-[#FF7A00] px-4 py-3 text-sm font-black text-black"
                >
                  تحديث الطلب إلى {next}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RestaurantMenuCenter({
  menu,
  updateMenu,
}: {
  menu: MenuItem[];
  updateMenu: (id: number, data: Partial<MenuItem>) => void;
}) {
  const active = menu.filter((item) => item.active && !item.outOfStock).length;
  const out = menu.filter((item) => item.outOfStock).length;
  const discounted = menu.filter((item) => item.discount > 0).length;
  const totalMenuSales = menu.reduce((sum, item) => sum + item.ordersToday * item.price, 0);

  return (
    <Card title="Restaurant Menu Center V1.2">
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="أصناف فعالة" value={active} color="text-green-300" />
        <MiniStat title="نافدة" value={out} color="text-red-300" />
        <MiniStat title="عليها خصم" value={discounted} color="text-[#FF7A00]" />
        <MiniStat title="قيمة مبيعات المنيو" value={`${totalMenuSales.toLocaleString()} د.ع`} color="text-white" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {menu.map((item) => {
          const finalPrice = item.discount
            ? item.price - Math.round((item.price * item.discount) / 100)
            : item.price;

          return (
            <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{item.name}</p>
                  <p className="mt-1 text-xs text-white/45">{item.category} — {item.ordersToday} طلب اليوم</p>
                </div>
                <Badge
                  text={item.outOfStock ? "نافد" : item.active ? "متاح" : "مخفي"}
                  color={item.outOfStock ? "bg-red-500/15 text-red-300" : item.active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/50"}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={item.price}
                  onChange={(event) => updateMenu(item.id, { price: Number(event.target.value) })}
                  className="rounded-2xl bg-black px-3 py-3 text-sm outline-none"
                />
                <input
                  type="number"
                  value={item.discount}
                  onChange={(event) => updateMenu(item.id, { discount: Number(event.target.value) })}
                  className="rounded-2xl bg-black px-3 py-3 text-sm outline-none"
                />
              </div>

              <div className="mt-3 rounded-2xl bg-black p-3 text-sm text-white/65">
                السعر النهائي: <span className="font-black text-[#FF7A00]">{finalPrice.toLocaleString()} د.ع</span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateMenu(item.id, { active: !item.active })}
                  className="rounded-2xl bg-white/10 p-3 text-sm font-black"
                >
                  {item.active ? "إخفاء" : "إظهار"}
                </button>
                <button
                  onClick={() => updateMenu(item.id, { outOfStock: !item.outOfStock })}
                  className="rounded-2xl bg-[#FF7A00] p-3 text-sm font-black text-black"
                >
                  {item.outOfStock ? "إرجاع للمخزون" : "تحديد نافد"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RestaurantNotificationsCenter({
  orders,
  menu,
  alerts,
  updateAlert,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  updateAlert: (id: number, data: Partial<RestaurantAlert>) => void;
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل");
  const outOfStock = menu.filter((item) => item.outOfStock);
  const activeAlerts = alerts.filter((alert) => alert.status !== "تم الحل");

  const smartNotifications = [
    ...urgentOrders.map((order) => ({
      id: `order-${order.id}`,
      title: `طلب عاجل ${order.id}`,
      message: `${order.customer} في ${order.area} يحتاج متابعة سريعة.`,
      color: "border-red-500/25 bg-red-500/10 text-red-200",
    })),
    ...outOfStock.map((item) => ({
      id: `menu-${item.id}`,
      title: `صنف نافد: ${item.name}`,
      message: "أخفِ الصنف أو حدث المخزون حتى لا يظهر للزبائن.",
      color: "border-yellow-500/25 bg-yellow-500/10 text-yellow-200",
    })),
    ...activeAlerts.map((alert) => ({
      id: `alert-${alert.id}`,
      title: alert.title,
      message: alert.message,
      color: alert.level === "عالي" ? "border-red-500/25 bg-red-500/10 text-red-200" : "border-[#FF7A00]/25 bg-[#FF7A00]/10 text-orange-200",
      alertId: alert.id,
    })),
  ];

  return (
    <Card
      title="Restaurant Notifications Center V1.2"
      action={
        <div className="rounded-2xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-300">
          {smartNotifications.length} Alert
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات عاجلة" value={urgentOrders.length} color="text-red-300" />
        <MiniStat title="أصناف نافدة" value={outOfStock.length} color="text-yellow-300" />
        <MiniStat title="تنبيهات نشطة" value={activeAlerts.length} color="text-[#FF7A00]" />
        <MiniStat title="مركز الإشعارات" value="Live" color="text-green-300" />
      </div>

      <div className="space-y-3">
        {smartNotifications.length === 0 && (
          <div className="rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-200">
            لا توجد تنبيهات حرجة حالياً. تشغيل المطعم مستقر.
          </div>
        )}

        {smartNotifications.slice(0, 8).map((notification) => (
          <div key={notification.id} className={`rounded-3xl border p-4 ${notification.color}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black">{notification.title}</p>
                <p className="mt-1 text-sm opacity-80">{notification.message}</p>
              </div>

              {"alertId" in notification && (
                <button
                  onClick={() => updateAlert(Number(notification.alertId), { status: "تم الحل" })}
                  className="rounded-2xl bg-black/30 px-4 py-2 text-xs font-black text-white"
                >
                  حل
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ExecutiveKPICenter({
  orders,
  totalSales,
  branches,
  restaurantOpen,
}: {
  orders: Order[];
  totalSales: number;
  branches: Branch[];
  restaurantOpen: boolean;
}) {
  const activeOrders = orders.filter(
    (order) => !["تم التسليم", "مرفوض"].includes(order.status)
  ).length;
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;
  const completionRate = orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0;
  const onlineDrivers = drivers.filter((driver) => driver.online).length;
  const branchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const growthRate = Math.round(((totalSales + branchSales * 0.04) / Math.max(branchSales, 1)) * 100);

  const executiveCards = [
    {
      title: "إجمالي الطلبات",
      value: orders.length,
      hint: `${activeOrders} طلب نشط`,
      color: "text-white",
      bg: "border-white/10 bg-white/5",
    },
    {
      title: "إيرادات مباشرة",
      value: `${totalSales.toLocaleString()} د.ع`,
      hint: "من لوحة المطعم الحالية",
      color: "text-[#FF7A00]",
      bg: "border-[#FF7A00]/25 bg-[#FF7A00]/10",
    },
    {
      title: "فروع نشطة",
      value: branches.length,
      hint: `${branches.filter((branch) => branch.status === "ممتاز").length} ممتاز`,
      color: "text-sky-300",
      bg: "border-sky-500/20 bg-sky-500/10",
    },
    {
      title: "السائقون المتصلون",
      value: onlineDrivers,
      hint: `${drivers.length} ضمن الأسطول`,
      color: "text-green-300",
      bg: "border-green-500/20 bg-green-500/10",
    },
    {
      title: "معدل الإنجاز",
      value: `${completionRate}%`,
      hint: `${deliveredOrders} طلب مكتمل`,
      color: "text-yellow-300",
      bg: "border-yellow-500/20 bg-yellow-500/10",
    },
    {
      title: "نمو تشغيلي",
      value: `${growthRate}%`,
      hint: restaurantOpen ? "المطعم يعمل" : "المطعم مغلق",
      color: restaurantOpen ? "text-green-300" : "text-red-300",
      bg: restaurantOpen ? "border-green-500/20 bg-green-500/10" : "border-red-500/20 bg-red-500/10",
    },
  ];

  return (
    <Card
      title="Executive KPI Center V1.2"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          CEO Live KPIs
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {executiveCards.map((card) => (
          <div key={card.title} className={`rounded-3xl border p-5 ${card.bg}`}>
            <p className="text-sm text-white/50">{card.title}</p>
            <h3 className={`mt-2 text-2xl font-black ${card.color}`}>{card.value}</h3>
            <p className="mt-2 text-xs text-white/40">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black p-4 text-sm text-white/65">
        👑 قراءة تنفيذية: الأداء مستقر، وأولوية الإدارة الآن هي رفع معدل الإنجاز وتقليل ضغط الطلبات النشطة.
      </div>
    </Card>
  );
}

function ExecutiveRevenueCenter({
  orders,
  totalSales,
  branches,
}: {
  orders: Order[];
  totalSales: number;
  branches: Branch[];
}) {
  const deliveredRevenue = orders
    .filter((order) => order.status === "تم التسليم")
    .reduce((sum, order) => sum + order.amount, 0);
  const pendingRevenue = Math.max(totalSales - deliveredRevenue, 0);
  const platformCommission = Math.round(totalSales * 0.12);
  const netRevenue = totalSales - platformCommission;
  const bestBranch = [...branches].sort((a, b) => b.sales - a.sales)[0];
  const weekRevenue = totalSales * 6 + Math.round(branches.reduce((sum, branch) => sum + branch.sales, 0) * 0.15);
  const monthRevenue = weekRevenue * 4;

  const bars = branches.map((branch) => {
    const maxSales = Math.max(...branches.map((item) => item.sales), 1);
    return {
      ...branch,
      width: Math.max(12, Math.round((branch.sales / maxSales) * 100)),
    };
  });

  return (
    <Card
      title="Executive Revenue Center V1.2"
      action={
        <div className="rounded-2xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          Revenue Command
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="إيراد اليوم" value={`${totalSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="إيراد الأسبوع" value={`${weekRevenue.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="إيراد الشهر" value={`${monthRevenue.toLocaleString()} د.ع`} color="text-sky-300" />
        <MiniStat title="صافي متوقع" value={`${netRevenue.toLocaleString()} د.ع`} color="text-yellow-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="font-black">توزيع الإيرادات</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs text-white/40">مؤكد</p>
              <p className="mt-1 text-xl font-black text-green-300">{deliveredRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs text-white/40">قيد التنفيذ</p>
              <p className="mt-1 text-xl font-black text-yellow-300">{pendingRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-2xl bg-black p-4">
              <p className="text-xs text-white/40">عمولة منصة</p>
              <p className="mt-1 text-xl font-black text-[#FF7A00]">{platformCommission.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <p className="font-black">أعلى الفروع مبيعاً</p>
          <p className="mt-1 text-xs text-white/45">الأفضل حالياً: {bestBranch?.name || "لا يوجد"}</p>
          <div className="mt-4 space-y-3">
            {bars.map((branch) => (
              <div key={branch.id}>
                <div className="mb-1 flex items-center justify-between text-xs text-white/45">
                  <span>{branch.name}</span>
                  <span>{branch.sales.toLocaleString()} د.ع</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black">
                  <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${branch.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ExecutiveAISummaryCenter({
  orders,
  menu,
  alerts,
  totalSales,
  branches,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  totalSales: number;
  branches: Branch[];
  restaurantOpen: boolean;
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل");
  const outOfStock = menu.filter((item) => item.outOfStock);
  const highAlerts = alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل");
  const weakBranches = branches.filter((branch) => branch.status === "يحتاج متابعة");
  const pressureScore = urgentOrders.length + outOfStock.length + highAlerts.length + weakBranches.length;
  const aiMode = pressureScore >= 5 ? "حرج" : pressureScore >= 3 ? "متابعة" : "مستقر";
  const aiColor = aiMode === "حرج" ? "text-red-300" : aiMode === "متابعة" ? "text-yellow-300" : "text-green-300";

  const actions = [
    urgentOrders.length ? `تحريك ${urgentOrders.length} طلب عاجل قبل باقي الطلبات.` : "لا توجد طلبات عاجلة حرجة حالياً.",
    outOfStock.length ? `إخفاء أو تعويض ${outOfStock.length} صنف نافد من المنيو.` : "توفر المنيو جيد حالياً.",
    highAlerts.length ? `حل ${highAlerts.length} تنبيه عالي قبل الذروة.` : "التنبيهات العالية تحت السيطرة.",
    weakBranches.length ? `متابعة ${weakBranches.map((branch) => branch.name).join("، ")}.` : "أداء الفروع مستقر.",
  ];

  return (
    <Card
      title="Executive AI Summary Center V1.2"
      action={
        <div className={`rounded-2xl bg-white/10 px-4 py-2 text-xs font-black ${aiColor}`}>
          AI Mode: {aiMode}
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="درجة الضغط" value={pressureScore} color={aiColor} />
        <MiniStat title="طلبات عاجلة" value={urgentOrders.length} color="text-red-300" />
        <MiniStat title="تنبيهات عالية" value={highAlerts.length} color="text-yellow-300" />
        <MiniStat title="إيراد قابل للنمو" value={`${Math.round(totalSales * 0.18).toLocaleString()} د.ع`} color="text-[#FF7A00]" />
      </div>

      <div className="rounded-3xl border border-[#FF7A00]/20 bg-[#FF7A00]/10 p-5">
        <p className="text-sm font-black text-[#FF7A00]">ملخص الرئيس التنفيذي</p>
        <p className="mt-2 text-sm leading-7 text-white/70">
          {restaurantOpen
            ? "النظام يعمل حالياً، والذكاء التنفيذي يوصي بالتركيز على الطلبات العاجلة وتوفر المنيو قبل زيادة الحمل."
            : "المطعم مغلق حالياً، والذكاء التنفيذي يوصي بإعداد المنيو والفروع قبل إعادة الفتح."}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {actions.map((action, index) => (
          <div key={action} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <span className="font-black text-[#FF7A00]">AI-{index + 1}: </span>
            {action}
          </div>
        ))}
      </div>
    </Card>
  );
}

function BranchAnalyticsCenter({
  branches,
  orders,
  totalSales,
}: {
  branches: Branch[];
  orders: Order[];
  totalSales: number;
}) {
  const totalBranchSales = branches.reduce((sum, branch) => sum + branch.sales, 0);
  const totalBranchOrders = branches.reduce((sum, branch) => sum + branch.orders, 0);
  const averageRating = branches.length
    ? (branches.reduce((sum, branch) => sum + branch.rating, 0) / branches.length).toFixed(1)
    : "0";
  const activeAreas = Array.from(new Set(orders.map((order) => order.area)));

  return (
    <Card
      title="Branch Analytics Center V1.2"
      action={
        <div className="rounded-2xl bg-sky-500/10 px-4 py-2 text-xs font-black text-sky-300">
          Branch Intelligence
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="مبيعات الفروع" value={`${totalBranchSales.toLocaleString()} د.ع`} color="text-[#FF7A00]" />
        <MiniStat title="طلبات الفروع" value={totalBranchOrders} color="text-green-300" />
        <MiniStat title="متوسط التقييم" value={`${averageRating}/5`} color="text-yellow-300" />
        <MiniStat title="مناطق نشطة" value={activeAreas.length} color="text-sky-300" />
      </div>

      <div className="space-y-3">
        {branches.map((branch) => {
          const salesShare = totalBranchSales ? Math.round((branch.sales / totalBranchSales) * 100) : 0;
          const orderShare = totalBranchOrders ? Math.round((branch.orders / totalBranchOrders) * 100) : 0;
          const revenueGap = Math.max(0, Math.round(totalSales * (salesShare / 100) - branch.sales * 0.02));

          return (
            <div key={branch.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black">{branch.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {branch.area} — ⭐ {branch.rating} — {branch.orders} طلب
                  </p>
                </div>
                <Badge
                  text={branch.status}
                  color={
                    branch.status === "ممتاز"
                      ? "bg-green-500/15 text-green-300"
                      : branch.status === "جيد"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : "bg-red-500/15 text-red-300"
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">حصة المبيعات</p>
                  <p className="mt-1 text-lg font-black text-[#FF7A00]">{salesShare}%</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">حصة الطلبات</p>
                  <p className="mt-1 text-lg font-black text-green-300">{orderShare}%</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">فرصة تحسين</p>
                  <p className="mt-1 text-lg font-black text-yellow-300">{revenueGap.toLocaleString()} د.ع</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${salesShare}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function getCustomerTier(customer: Customer) {
  if (customer.segment === "VIP" || customer.totalSpend >= 300000) return "VIP";
  if (customer.totalSpend >= 180000) return "Gold";
  if (customer.totalSpend >= 80000) return "Silver";
  return "Bronze";
}

function getCustomerPoints(customer: Customer) {
  return Math.round(customer.totalSpend / 1000) + customer.orders * 12 + customer.satisfaction;
}

function PointsCenter({
  customers,
  orders,
}: {
  customers: Customer[];
  orders: Order[];
}) {
  const totalPoints = customers.reduce((sum, customer) => sum + getCustomerPoints(customer), 0);
  const vipCustomers = customers.filter((customer) => getCustomerTier(customer) === "VIP").length;
  const returningCustomers = customers.filter((customer) => customer.returning).length;
  const averageOrderValue = orders.length
    ? Math.round(orders.reduce((sum, order) => sum + order.amount, 0) / orders.length)
    : 0;

  return (
    <Card
      title="Points Center — Loyalty Production"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Loyalty Live
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="إجمالي النقاط" value={totalPoints.toLocaleString()} color="text-[#FF7A00]" />
        <MiniStat title="عملاء VIP" value={vipCustomers} color="text-yellow-300" />
        <MiniStat title="عملاء راجعين" value={returningCustomers} color="text-green-300" />
        <MiniStat title="متوسط الطلب" value={`${averageOrderValue.toLocaleString()} د.ع`} color="text-white" />
      </div>

      <div className="space-y-3">
        {customers.map((customer) => {
          const points = getCustomerPoints(customer);
          const tier = getCustomerTier(customer);
          const progress = Math.min(100, Math.round((points / 650) * 100));

          return (
            <div key={customer.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-black">{customer.name}</p>
                  <p className="mt-1 text-xs text-white/45">
                    {customer.area} — {customer.orders} طلب — آخر طلب: {customer.lastOrder}
                  </p>
                </div>
                <Badge
                  text={tier}
                  color={
                    tier === "VIP"
                      ? "bg-[#FF7A00]/15 text-[#FF7A00]"
                      : tier === "Gold"
                      ? "bg-yellow-500/15 text-yellow-300"
                      : tier === "Silver"
                      ? "bg-sky-500/15 text-sky-300"
                      : "bg-white/10 text-white/55"
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">النقاط</p>
                  <p className="mt-1 text-lg font-black text-[#FF7A00]">{points}</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">الصرف الكلي</p>
                  <p className="mt-1 text-lg font-black text-green-300">{customer.totalSpend.toLocaleString()} د.ع</p>
                </div>
                <div className="rounded-2xl bg-black p-3">
                  <p className="text-xs text-white/35">الرضا</p>
                  <p className="mt-1 text-lg font-black text-yellow-300">{customer.satisfaction}%</p>
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
                <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RewardsCenter({
  customers,
  orders,
}: {
  customers: Customer[];
  orders: Order[];
}) {
  const eligibleCustomers = customers.filter((customer) => getCustomerPoints(customer) >= 250);
  const deliveredOrders = orders.filter((order) => order.status === "تم التسليم").length;

  const rewards = [
    { title: "خصم 3,000 د.ع", points: 180, type: "خصم مباشر", active: true },
    { title: "توصيل مجاني", points: 220, type: "Delivery", active: true },
    { title: "مشروب مجاني", points: 260, type: "هدية", active: true },
    { title: "عرض VIP خاص", points: 420, type: "VIP", active: eligibleCustomers.length > 0 },
  ];

  return (
    <Card
      title="Rewards Center — Loyalty Production"
      action={
        <div className="rounded-2xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          Rewards Engine
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="مكافآت فعالة" value={rewards.filter((reward) => reward.active).length} color="text-green-300" />
        <MiniStat title="عملاء مؤهلين" value={eligibleCustomers.length} color="text-[#FF7A00]" />
        <MiniStat title="طلبات مكتملة" value={deliveredOrders} color="text-yellow-300" />
        <MiniStat title="مكافآت اليوم" value="4" color="text-white" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rewards.map((reward) => (
          <div key={reward.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">{reward.title}</p>
                <p className="mt-1 text-xs text-white/45">{reward.type} — تحتاج {reward.points} نقطة</p>
              </div>
              <Badge
                text={reward.active ? "فعالة" : "مقفلة"}
                color={reward.active ? "bg-green-500/15 text-green-300" : "bg-white/10 text-white/40"}
              />
            </div>
            <p className="mt-4 rounded-2xl bg-black p-4 text-sm text-white/65">
              مكافأة جاهزة للاستخدام داخل تطبيق الزبون وتظهر حسب نقاط العميل ومستوى العضوية.
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CouponsCenter({
  customers,
  orders,
  menu,
}: {
  customers: Customer[];
  orders: Order[];
  menu: MenuItem[];
}) {
  const atRisk = customers.filter((customer) => customer.segment === "At Risk").length;
  const inactiveCoupons = menu.filter((item) => item.outOfStock).length;
  const couponValue = Math.round(orders.reduce((sum, order) => sum + order.amount, 0) * 0.08);

  const coupons = [
    { code: "FUSE10", discount: "10%", target: "كل العملاء", status: "فعال" },
    { code: "VIP25", discount: "25%", target: "VIP", status: "فعال" },
    { code: "COMEBACK", discount: "3,000 د.ع", target: "At Risk", status: atRisk ? "مقترح" : "جاهز" },
    { code: "BREAKFAST", discount: "15%", target: "فطور", status: inactiveCoupons ? "يحتاج فحص" : "فعال" },
  ];

  return (
    <Card
      title="Coupons Center — Loyalty Production"
      action={
        <div className="rounded-2xl bg-yellow-500/10 px-4 py-2 text-xs font-black text-yellow-300">
          Coupon Studio
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="كوبونات" value={coupons.length} color="text-[#FF7A00]" />
        <MiniStat title="عملاء يحتاجون رجوع" value={atRisk} color="text-red-300" />
        <MiniStat title="قيمة متوقعة" value={`${couponValue.toLocaleString()} د.ع`} color="text-green-300" />
        <MiniStat title="أصناف للفحص" value={inactiveCoupons} color="text-yellow-300" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {coupons.map((coupon) => (
          <div key={coupon.code} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black text-[#FF7A00]">{coupon.code}</p>
            <p className="mt-2 text-2xl font-black">{coupon.discount}</p>
            <p className="mt-2 text-xs text-white/45">الاستهداف: {coupon.target}</p>
            <Badge
              text={coupon.status}
              color={coupon.status === "فعال" ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function CampaignsCenter({
  customers,
  orders,
  menu,
}: {
  customers: Customer[];
  orders: Order[];
  menu: MenuItem[];
}) {
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const activeCustomers = customers.filter((customer) => customer.returning).length;
  const campaignLift = Math.round(totalSales * 0.16);

  const campaigns = [
    { name: "حملة فطور الصباح", target: "محبي الفطور", reach: customers.filter((customer) => customer.favoriteCategory === "فطور").length, roi: "18%" },
    { name: "إرجاع العملاء الخاملين", target: "At Risk", reach: customers.filter((customer) => customer.segment === "At Risk").length, roi: "24%" },
    { name: "أفضل الأصناف", target: "كل العملاء", reach: customers.length, roi: "15%" },
  ];

  return (
    <Card
      title="Campaigns Center — Marketing Automation"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Campaign Live
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="حملات نشطة" value={campaigns.length} color="text-[#FF7A00]" />
        <MiniStat title="عملاء نشطين" value={activeCustomers} color="text-green-300" />
        <MiniStat title="أصناف قابلة للتسويق" value={menu.filter((item) => !item.outOfStock).length} color="text-yellow-300" />
        <MiniStat title="رفع متوقع" value={`${campaignLift.toLocaleString()} د.ع`} color="text-white" />
      </div>

      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black">{campaign.name}</p>
                <p className="mt-1 text-xs text-white/45">استهداف: {campaign.target} — وصول: {campaign.reach} عميل</p>
              </div>
              <Badge text={`ROI ${campaign.roi}`} color="bg-green-500/15 text-green-300" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PushCampaignCenter({
  customers,
  orders,
  alerts,
}: {
  customers: Customer[];
  orders: Order[];
  alerts: RestaurantAlert[];
}) {
  const urgentOrders = orders.filter((order) => order.priority === "عاجل").length;
  const highAlerts = alerts.filter((alert) => alert.level === "عالي").length;
  const pushQueue = [
    { title: "طلبك المفضل متوفر الآن", segment: "Frequent", count: customers.filter((customer) => customer.segment === "Frequent").length },
    { title: "عرض VIP خاص اليوم", segment: "VIP", count: customers.filter((customer) => customer.segment === "VIP").length },
    { title: "رجعنالك بخصم خاص", segment: "At Risk", count: customers.filter((customer) => customer.segment === "At Risk").length },
  ];

  return (
    <Card
      title="Push Campaign Center — Marketing Automation"
      action={
        <div className="rounded-2xl bg-sky-500/10 px-4 py-2 text-xs font-black text-sky-300">
          Push Ready
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="إشعارات جاهزة" value={pushQueue.length} color="text-sky-300" />
        <MiniStat title="عملاء مستهدفين" value={customers.length} color="text-[#FF7A00]" />
        <MiniStat title="طلبات عاجلة" value={urgentOrders} color="text-red-300" />
        <MiniStat title="تنبيهات عالية" value={highAlerts} color="text-yellow-300" />
      </div>

      <div className="space-y-3">
        {pushQueue.map((push) => (
          <div key={push.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{push.title}</p>
            <p className="mt-1 text-xs text-white/45">Segment: {push.segment} — Recipients: {push.count}</p>
            <div className="mt-3 rounded-2xl bg-black p-3 text-sm text-white/60">
              جاهز للربط مع Firebase Cloud Messaging عند تفعيل مفاتيح الإنتاج.
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SmartOffersCenter({
  customers,
  orders,
  menu,
  alerts,
}: {
  customers: Customer[];
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const topItem = [...menu].sort((a, b) => b.ordersToday - a.ordersToday)[0];
  const lowDemandItems = menu.filter((item) => item.ordersToday <= 15 && !item.outOfStock);
  const atRisk = customers.filter((customer) => customer.segment === "At Risk").length;
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;

  const offers = [
    { title: `Boost ${topItem?.name || "أفضل صنف"}`, desc: "عرض خفيف على الصنف الأكثر طلباً بدون تقليل الربحية.", impact: "مبيعات +12%" },
    { title: "Reactivate At Risk", desc: `استهداف ${atRisk} عملاء غير نشطين بكوبون رجوع ذكي.`, impact: "رجوع +18%" },
    { title: "Move Low Demand", desc: `${lowDemandItems.length} أصناف تحتاج عرض ذكي لتدوير المخزون.`, impact: "مخزون -9%" },
  ];

  return (
    <Card
      title="Smart Offers Center — AI Marketing"
      action={
        <div className="rounded-2xl bg-purple-500/10 px-4 py-2 text-xs font-black text-purple-300">
          AI Offers
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="عروض AI" value={offers.length} color="text-purple-300" />
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-[#FF7A00]" />
        <MiniStat title="تنبيهات" value={alerts.length} color="text-yellow-300" />
        <MiniStat title="أصناف منخفضة" value={lowDemandItems.length} color="text-red-300" />
      </div>

      <div className="space-y-3">
        {offers.map((offer) => (
          <div key={offer.title} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-black">{offer.title}</p>
                <p className="mt-1 text-sm text-white/55">{offer.desc}</p>
              </div>
              <Badge text={offer.impact} color="bg-[#FF7A00]/15 text-[#FF7A00]" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProductionReadyCenter({
  orders,
  menu,
  alerts,
  branches,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  branches: Branch[];
}) {
  const checklist = [
    { item: "Orders Module", done: orders.length > 0 },
    { item: "Menu Module", done: menu.length > 0 },
    { item: "Alerts Module", done: alerts.length > 0 },
    { item: "Branches Module", done: branches.length > 0 },
    { item: "Loyalty Module", done: true },
    { item: "Marketing Module", done: true },
    { item: "Go Live Controls", done: true },
  ];
  const done = checklist.filter((item) => item.done).length;
  const ready = Math.round((done / checklist.length) * 100);

  return (
    <Card
      title="Production Ready Center — Go Live"
      action={
        <div className="rounded-2xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          {ready}% Ready
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="جاهزية الإنتاج" value={`${ready}%`} color="text-green-300" />
        <MiniStat title="Modules Ready" value={`${done}/${checklist.length}`} color="text-[#FF7A00]" />
        <MiniStat title="تنبيهات مفتوحة" value={alerts.filter((alert) => alert.status !== "تم الحل").length} color="text-yellow-300" />
        <MiniStat title="فروع" value={branches.length} color="text-white" />
      </div>

      <div className="space-y-2">
        {checklist.map((check) => (
          <div key={check.item} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
            <span className="text-sm font-bold">{check.item}</span>
            <Badge
              text={check.done ? "Ready" : "Pending"}
              color={check.done ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function LaunchStatusCenter({
  orders,
  menu,
  alerts,
  branches,
  restaurantOpen,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
  branches: Branch[];
  restaurantOpen: boolean;
}) {
  const launchScore = Math.min(
    100,
    58 + orders.length * 3 + menu.filter((item) => item.active).length * 4 + branches.length * 5 - alerts.filter((alert) => alert.level === "عالي" && alert.status !== "تم الحل").length * 6
  );
  const launchStatus = launchScore >= 85 ? "جاهز للإطلاق" : launchScore >= 70 ? "قريب من الإطلاق" : "يحتاج إكمال";

  return (
    <Card
      title="Launch Status Center — Go Live"
      action={
        <div className="rounded-2xl bg-[#FF7A00]/10 px-4 py-2 text-xs font-black text-[#FF7A00]">
          Launch Control
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="Launch Score" value={`${launchScore}%`} color="text-[#FF7A00]" />
        <MiniStat title="الحالة" value={launchStatus} color={launchScore >= 85 ? "text-green-300" : "text-yellow-300"} />
        <MiniStat title="المطعم" value={restaurantOpen ? "مفتوح" : "مغلق"} color={restaurantOpen ? "text-green-300" : "text-red-300"} />
        <MiniStat title="فروع جاهزة" value={branches.length} color="text-white" />
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p className="font-black">قرار الإطلاق</p>
        <p className="mt-2 text-sm text-white/60">
          {launchScore >= 85
            ? "النظام جاهز لدخول مرحلة الربط الحقيقي مع Firebase وخرائط Google والإشعارات الإنتاجية."
            : "اكمل التنبيهات المفتوحة وفحص المنيو قبل الإطلاق النهائي."}
        </p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black">
          <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${launchScore}%` }} />
        </div>
      </div>
    </Card>
  );
}

function SystemHealthCenter({
  orders,
  menu,
  alerts,
}: {
  orders: Order[];
  menu: MenuItem[];
  alerts: RestaurantAlert[];
}) {
  const unresolvedAlerts = alerts.filter((alert) => alert.status !== "تم الحل").length;
  const activeOrders = orders.filter((order) => !["تم التسليم", "مرفوض"].includes(order.status)).length;
  const activeMenu = menu.filter((item) => item.active && !item.outOfStock).length;

  const systems = [
    { name: "Orders API", value: activeOrders > 0 ? 96 : 91, status: "Stable" },
    { name: "Menu Service", value: activeMenu ? 98 : 74, status: activeMenu ? "Stable" : "Review" },
    { name: "Alerts Engine", value: Math.max(70, 100 - unresolvedAlerts * 8), status: unresolvedAlerts ? "Watch" : "Stable" },
    { name: "Dashboard UI", value: 99, status: "Stable" },
  ];

  return (
    <Card
      title="System Health Center — Go Live"
      action={
        <div className="rounded-2xl bg-green-500/10 px-4 py-2 text-xs font-black text-green-300">
          Live Health
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MiniStat title="طلبات نشطة" value={activeOrders} color="text-[#FF7A00]" />
        <MiniStat title="منيو متاح" value={activeMenu} color="text-green-300" />
        <MiniStat title="تنبيهات مفتوحة" value={unresolvedAlerts} color="text-yellow-300" />
        <MiniStat title="Uptime" value="99.8%" color="text-white" />
      </div>

      <div className="space-y-3">
        {systems.map((system) => (
          <div key={system.name} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-black">{system.name}</p>
                <p className="mt-1 text-xs text-white/45">Status: {system.status}</p>
              </div>
              <span className="text-lg font-black text-[#FF7A00]">{system.value}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black">
              <div className="h-full rounded-full bg-[#FF7A00]" style={{ width: `${system.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

