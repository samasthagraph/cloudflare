import { useLoaderData, useActionData, Form, useNavigation, Link, useRouteLoaderData } from "@remix-run/react";
import { json, type MetaFunction } from "@remix-run/cloudflare";
import { Send, MapPin, Phone, Mail, Clock, CheckCircle, CheckCircle2, Navigation, ArrowRight, AlertCircle } from "lucide-react";
import * as FaIcons from "react-icons/fa";
import { OptimizedImage } from "~/components/OptimizedImage";
import { Footer } from "../components/Footer";
import { useEffect, useRef } from "react";
import { CompactHero } from "~/components/CompactHero";

const renderIcon = (iconName: string) => {
  if (!iconName) return <FaIcons.FaGlobe size={24} />;
  const IconComponent = (FaIcons as any)[iconName];
  return IconComponent ? <IconComponent size={24} /> : <FaIcons.FaGlobe size={24} />;
};

export const action = async ({ request }: any) => {
  const formData = await request.formData();
  const name = String(formData.get("name") || "");
  const mobile = String(formData.get("mobile") || "");
  const message = String(formData.get("message") || "");

  if (!name.trim() || name.length < 2) {
    return json({ error: "Please provide a valid name." }, { status: 400 });
  }
  if (!message.trim() || message.length < 10) {
    return json({ error: "Message is too short. Please provide more detail." }, { status: 400 });
  }

  const payload = {
    name, mobile, message,
    createdAt: new Date().toISOString(),
    source: "website-contact",
    status: "new"
  };
  
  console.log("CMS Submission Received:", payload);
  await new Promise(resolve => setTimeout(resolve, 1500));

  return json({ success: true });
};

export const meta: MetaFunction = ({ location }) => {
  const url = `https://samasthagraph.pages.dev${location.pathname}`;
  return [
    { title: "Contact Us | Samastha Graph" },
    { name: "description", content: "Get in touch with Samastha Graph" },
    { property: "og:title", content: "Contact Us | Samastha Graph" },
    { property: "og:url", content: url },
    { tagName: "link", rel: "canonical", href: url },
    { tagName: "link", rel: "alternate", hreflang: "ml", href: "https://samasthagraph.pages.dev/contact" },
    { tagName: "link", rel: "alternate", hreflang: "en", href: "https://samasthagraph.pages.dev/en/contact" }
  ];
};

export const loader = async () => {
  let contactData = null;
  let aboutData = null;
  
  try {
    const contactFiles = import.meta.glob("../content/settings/contact.json", { import: 'default', eager: true });
    contactData = Object.values(contactFiles)[0] || null;
    
    const aboutFiles = import.meta.glob("../content/settings/about.json", { import: 'default', eager: true });
    aboutData = Object.values(aboutFiles)[0] || null;
  } catch (e) {}

  const data = contactData || {
    hero: {
      eyebrow: "GET IN TOUCH",
      headline: "Let's Connect",
      support: "We're here to listen.",
      description: "Have a question about our publications, wish to collaborate, or just want to share your feedback? Our team is ready to hear from you.",
      image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop"
    },
    details: {
      title: "Reach Out",
      description: "You can reach us through any of the following channels.",
      addressTitle: "Headquarters",
      addressDetails: "Samastha Centre, Kozhikode 673006",
      email: "info@samasthagraph.com"
    },
    location: {
      title: "Visit Samastha Centre",
      description: "Samastha Centre, Kozhikode 673006",
      image: "https://images.unsplash.com/photo-1584697964328-b1e7f63dca95?q=80&w=2070&auto=format&fit=crop"
    },
    communicationNote: {
      heading: "Every message matters.",
      description: "Whether you have a question, suggestion, collaboration proposal, or feedback, we value your communication with Samastha Graph."
    }
  };

  return json({ data });
};

export default function Contact() {
  const { data } = useLoaderData<typeof loader>();
  const rootData = useRouteLoaderData("root") as any;
  const socialPlatforms = (rootData?.socialPlatforms?.platforms || []).filter((l: any) => l.active !== false).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const actionData = useActionData<typeof action>() as any;
  const navigation = useNavigation();
  const formRef = useRef<HTMLFormElement>(null);

  const isSubmitting = navigation.state === "submitting";
  const isSuccess = actionData?.success;

  useEffect(() => {
    if (isSuccess && formRef.current) {
      formRef.current.reset();
    }
  }, [isSuccess]);

  return (
    <div className="bg-brand-light min-h-screen font-sans text-gray-800 selection:bg-brand-gold selection:text-brand-dark">
      
      <CompactHero
        eyebrow={data.hero?.eyebrow || 'Get In Touch'}
        title={<>Connect With <span className="text-[#c8a136]">Our Team</span>.</>}
        subtitle={data.hero?.support || "Get in Touch — Collaborations, Feedback & Inquiries"}
        description={data.hero?.description || "Have questions, feedback, or collaboration proposals? Reach out to the Samastha Graph editorial and broadcasting team."}
        actions={
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#contact-form" className="bg-[#c8a136] text-[#15664a] font-bold px-8 py-3.5 rounded-full hover:bg-yellow-500 transition-all shadow-lg shadow-[#c8a136]/20 inline-flex items-center gap-2 text-sm uppercase tracking-wider">
              Send a Message ↓
            </a>
            <a href="#location" className="bg-transparent border-2 border-white/60 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white hover:text-[#15664a] transition-all inline-flex items-center gap-2 text-sm uppercase tracking-wider">
              Headquarters Info
            </a>
          </div>
        }
        align="left"
        sideContent={
          <div className="relative group cursor-pointer block w-full text-left">
            <div className="absolute inset-0 bg-[#c8a136] rounded-2xl transform rotate-3 scale-105 opacity-20 transition-transform group-hover:rotate-6"></div>
            <div className="relative bg-black border border-[#2D5A46] rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
              {data.hero?.image ? (
                <OptimizedImage src={data.hero.image} alt="Samastha Graph Headquarters" priority={true} className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-[#133022] flex items-center justify-center">
                  <span className="text-[#c8a136] font-heading font-bold text-2xl">Samastha Centre</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/40 to-transparent">
                <span className="bg-[#15664a] text-white text-xs font-bold px-2.5 py-1 rounded mb-2 inline-block uppercase">
                  Headquarters
                </span>
                <h3 className="font-heading font-bold text-lg text-white line-clamp-1">Samastha Centre, Kozhikode</h3>
              </div>
            </div>
          </div>
        }
      />

      <section className="py-24 relative z-20 -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[40px] shadow-2xl shadow-brand-dark/5 overflow-hidden flex flex-col lg:flex-row border border-brand-surface">
            
            <div className="lg:w-[40%] bg-brand-surface/20 p-12 lg:p-16 border-r border-brand-surface relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              
              <h2 className="text-3xl font-heading font-bold text-brand-dark mb-4">{data.details?.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-12">{data.details?.description}</p>
              
              <div className="space-y-10">
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-gold shadow-sm group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                    <MapPin size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-dark font-heading text-lg mb-1">{data.details?.addressTitle}</h3>
                    <p className="text-gray-600 font-medium">{data.details?.addressDetails}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-gold shadow-sm group-hover:bg-brand-gold group-hover:text-white transition-colors duration-300">
                    <Mail size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-brand-dark font-heading text-lg mb-1">Email Us</h3>
                    <a href={`mailto:${data.details?.email}`} className="text-gray-600 font-medium hover:text-brand-gold transition-colors">
                      {data.details?.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-[60%] p-12 lg:p-16 relative">
              <h2 className="text-2xl font-heading font-bold text-brand-dark mb-10">Send Us A Message</h2>
              
              {isSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center animate-[fade-in_0.5s_ease-out] py-12">
                  <div className="w-20 h-20 rounded-full bg-[#15664a]/10 flex items-center justify-center mb-6 text-[#15664a]">
                    <CheckCircle2 size={40} />
                  </div>
                  <h3 className="text-2xl font-heading font-bold text-brand-dark mb-4">Message Sent Successfully</h3>
                  <div className="w-12 h-0.5 bg-brand-gold mx-auto mb-6"></div>
                  <p className="text-gray-600 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out to Samastha Graph. Your message has been received and our team will review it shortly.
                  </p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-10 text-brand-gold font-bold hover:text-brand-dark transition-colors uppercase tracking-wide text-sm"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <Form method="post" ref={formRef} className="space-y-12">
                  
                  {actionData?.error && (
                    <div className="bg-red-50 text-red-800 p-4 rounded-xl flex items-start gap-3 border border-red-100 animate-[fade-in_0.3s_ease-out]">
                      <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{actionData.error}</span>
                    </div>
                  )}

                  <div className="relative group">
                    <input 
                      type="text" 
                      name="name" 
                      id="name"
                      required
                      placeholder="Your full name"
                      className="w-full bg-transparent border-0 border-b border-gray-300 pb-3 text-lg text-brand-dark focus:ring-0 focus:border-brand-gold transition-colors peer placeholder-transparent"
                    />
                    <label 
                      htmlFor="name" 
                      className="absolute left-0 -top-6 text-sm font-bold text-brand-olive transition-all peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-lg peer-placeholder-shown:top-0 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-brand-dark cursor-text"
                    >
                      Name
                    </label>
                  </div>

                  <div className="relative group">
                    <input 
                      type="tel" 
                      name="mobile" 
                      id="mobile"
                      placeholder="Your mobile number"
                      className="w-full bg-transparent border-0 border-b border-gray-300 pb-3 text-lg text-brand-dark focus:ring-0 focus:border-brand-gold transition-colors peer placeholder-transparent"
                    />
                    <label 
                      htmlFor="mobile" 
                      className="absolute left-0 -top-6 text-sm font-bold text-brand-olive transition-all peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-lg peer-placeholder-shown:top-0 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-brand-dark cursor-text"
                    >
                      Mobile Number (Optional)
                    </label>
                  </div>

                  <div className="relative group">
                    <textarea 
                      name="message" 
                      id="message"
                      required
                      rows={4}
                      placeholder="Write your message here..."
                      className="w-full bg-transparent border-0 border-b border-gray-300 pb-3 text-lg text-brand-dark focus:ring-0 focus:border-brand-gold transition-colors peer placeholder-transparent resize-none"
                    ></textarea>
                    <label 
                      htmlFor="message" 
                      className="absolute left-0 -top-6 text-sm font-bold text-brand-olive transition-all peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-lg peer-placeholder-shown:top-0 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-brand-dark cursor-text"
                    >
                      Message
                    </label>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="group flex items-center justify-between w-full sm:w-auto min-w-[240px] bg-[#15664a] text-white font-bold px-8 py-5 rounded-full hover:bg-[#60834f] transition-all duration-300 shadow-xl shadow-brand-dark/10 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-1"
                    >
                      <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                      {!isSubmitting && <ArrowRight size={20} className="text-[#c8a136] group-hover:translate-x-2 transition-transform duration-300" />}
                    </button>
                  </div>
                </Form>
              )}
            </div>
            
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-[0.2em] text-brand-gold uppercase mb-4 block">Headquarters</h2>
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-brand-dark">{data.location?.title}</h3>
            <p className="text-brand-olive font-medium mt-4 text-lg">{data.location?.description}</p>
          </div>
          
          {data.location?.image && (
            <div className="md:col-span-1 rounded-3xl overflow-hidden shadow-lg border border-brand-surface relative group h-[300px] md:h-auto">
              <div className="absolute inset-0 bg-brand-dark/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <OptimizedImage src={data.location.image} alt="Samastha Centre Location" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[1.5s] ease-out" />
            </div>
          )}
        </div>
      </section>

      <section className="py-32 bg-brand-surface/30 relative border-y border-brand-surface">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-brand-dark leading-tight mb-8">
            "{data.communicationNote?.heading}"
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed font-body font-light">
            {data.communicationNote?.description}
          </p>
          <div className="w-16 h-1 bg-brand-gold mx-auto mt-12 rounded-full"></div>
        </div>
      </section>

      {socialPlatforms && socialPlatforms.filter((p:any) => p.enabled).length > 0 && (
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-16">
              <span className="text-sm font-bold tracking-[0.2em] text-brand-olive uppercase mb-4 block">Network</span>
              <h2 className="text-4xl font-heading font-bold text-brand-dark">Social & Media Connect</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {socialPlatforms
                .filter((p: any) => p.enabled)
                .sort((a:any, b:any) => a.sortOrder - b.sortOrder)
                .map((platform: any) => (
                <a 
                  key={platform.id} 
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block p-8 rounded-3xl bg-brand-light border border-brand-surface hover:bg-[#15664a] hover:border-[#15664a] transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 text-center"
                >
                  <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-brand-gold shadow-sm group-hover:scale-110 transition-transform duration-300 mb-6">
                    {renderIcon(platform.icon)}
                  </div>
                  <h3 className="font-heading font-bold text-xl text-brand-dark group-hover:text-white transition-colors mb-2">{platform.name}</h3>
                  {platform.username && (
                    <p className="text-sm text-brand-olive group-hover:text-brand-gold transition-colors font-medium">
                      {platform.username}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}