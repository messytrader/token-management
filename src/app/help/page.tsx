import Link from "next/link";
import { ArrowLeft, CheckCircle2, Phone, Printer, QrCode, UserPlus } from "lucide-react";
import { getT } from "@/i18n/server";
import { LanguageToggle } from "@/components/LanguageToggle";

export default async function HelpPage() {
  const { t, lang } = await getT();
  const hi = lang === "hi";

  const steps = hi
    ? [
        { icon: UserPlus, title: "पहला कदम: खाता बनाएँ", text: "अपना नाम, मोबाइल नंबर और 6 अंकों का PIN डालकर खाता बनाएँ। PIN याद रखें — यह भविष्य में लॉगिन के लिए चाहिए होगा।" },
        { icon: CheckCircle2, title: "अनुरोध भरें", text: "\"नया अनुरोध\" पर जाएँ, अपना पता, विभाग, कारण और तारीख भरें। यदि मामला अत्यावश्यक है (जैसे मरीज़ से जुड़ा), तो \"अत्यावश्यक\" पर टिक करें।" },
        { icon: QrCode, title: "टोकन नंबर प्राप्त करें", text: "जमा करते ही आपको एक टोकन नंबर मिलेगा। यह नंबर आपका पहचान नंबर है। इसे लिख लें या स्क्रीनशॉट ले लें।" },
        { icon: Printer, title: "रसीद प्रिंट करें (वैकल्पिक)", text: "टोकन पेज पर \"प्रिंट / रसीद सेव करें\" बटन से आप रसीद प्रिंट या PDF के रूप में सेव कर सकते हैं।" },
        { icon: CheckCircle2, title: "स्थिति देखें", text: "आपका टोकन पेज अपने आप अपडेट होता है। जैसे ही निदेशक कार्यालय आपका अनुरोध स्वीकृत या अस्वीकृत करेगा, आपको तुरंत पता चल जाएगा — रीफ़्रेश करने की ज़रूरत नहीं।" },
        { icon: Phone, title: "PIN भूल जाएँ तो", text: "कार्यालय में PA डेस्क पर जाएँ और अपनी पहचान बताएँ। वे आपको एक अस्थायी कोड देंगे, जिससे आप \"PIN रीसेट करें\" पेज पर नया PIN बना सकते हैं।" },
      ]
    : [
        { icon: UserPlus, title: "Step 1: Create an account", text: "Enter your name, mobile number and a 6-digit PIN. Remember your PIN — you will need it to log in later." },
        { icon: CheckCircle2, title: "Fill your request", text: "Go to \"New request\", fill your address, department, reason and date. If it is urgent (e.g. medical), tick \"Urgent\"." },
        { icon: QrCode, title: "Get your token number", text: "As soon as you submit, you get a token number. This is your identifier. Note it down or take a screenshot." },
        { icon: Printer, title: "Print receipt (optional)", text: "On your token page, use \"Print / Save receipt\" to print or save a PDF copy." },
        { icon: CheckCircle2, title: "Check your status", text: "Your token page updates automatically. As soon as your request is approved or declined, you'll see it instantly — no need to refresh." },
        { icon: Phone, title: "Forgot your PIN?", text: "Visit the PA desk at the office with your ID. They will give you a temporary code to set a new PIN on the \"Reset PIN\" page." },
      ];

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ArrowLeft className="size-4" /> {hi ? "वापस" : "Back"}
          </Link>
          <LanguageToggle />
        </div>

        <h1 className="mt-5">{hi ? "उपयोग कैसे करें" : "How to use this system"}</h1>
        <p className="mt-1 text-muted-foreground">
          {hi ? "निदेशक से मिलने के लिए अपॉइंटमेंट अनुरोध की पूरी प्रक्रिया।" : "The complete process to request a meeting with the Director."}
        </p>

        <div className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <s.icon className="size-5" />
              </span>
              <div>
                <h2 className="mb-1">{s.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-primary/30 bg-secondary p-5">
          <p className="text-sm font-medium text-primary">
            {hi ? "किसी सहायता की आवश्यकता है?" : "Need further assistance?"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hi
              ? "कृपया कार्यालय समय (सुबह 9:30 – शाम 5:00, कार्यदिवसों में) के दौरान PA डेस्क पर संपर्क करें।"
              : "Please visit the PA desk during office hours (9:30 AM – 5:00 PM, working days)."}
          </p>
        </div>
      </div>
    </main>
  );
}