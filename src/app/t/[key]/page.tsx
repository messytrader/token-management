import { notFound } from "next/navigation";
import { getTokenByKey, getQueuePosition } from "@/app/actions/token";
import { getT } from "@/i18n/server";
import { TokenView } from "../[key]/TokenView";

export const dynamic = "force-dynamic";

export default async function TokenPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const token = await getTokenByKey(key);
  if (!token) notFound();

  const position =
    token.status === "approved" || token.status === "in_meeting"
      ? await getQueuePosition(token.id)
      : null;

  const { t, lang } = await getT();

  return (
    <TokenView
      accessKey={key}
      initial={token}
      initialPosition={position}
      lang={lang}
      dict={{
        office: t("token.office"),
        tokenNo: t("token.tokenNo"),
        status: {
          pending: t("token.status.pending"),
          approved: t("token.status.approved"),
          rejected: t("token.status.rejected"),
          in_meeting: t("token.status.in_meeting"),
          completed: t("token.status.completed"),
          no_show: t("token.status.no_show"),
          cancelled: t("token.status.cancelled"),
          expired: t("token.status.expired"),
          rescheduled: t("token.status.rescheduled"),
        },
        statusLine: {
          pending: t("token.statusLine.pending"),
          approved: t("token.statusLine.approved"),
          rejected: t("token.statusLine.rejected"),
          in_meeting: t("token.statusLine.in_meeting"),
          completed: t("token.statusLine.completed"),
          no_show: t("token.statusLine.no_show"),
          cancelled: t("token.statusLine.cancelled"),
          expired: t("token.statusLine.expired"),
          rescheduled: t("token.statusLine.rescheduled"),
        },
        position: t("token.position"),
        positionZero: t("token.positionZero"),
        remark: t("token.remark"),
        urgent: t("token.urgent"),
        vip: t("token.vip"),
        details: t("token.details"),
        name: t("token.name"),
        department: t("token.department"),
        date: t("token.date"),
        time: t("token.time"),
        duration: t("token.duration"),
        minutes: t("token.minutes"),
        print: t("token.print"),
        backHome: t("token.backHome"),
        liveNote: t("token.liveNote"),
        receiptFooter: t("token.receiptFooter"),
      }}
    />
  );
}