import Layout from "@/components/Layout";
import MessagesInbox from "@/components/MessagesInbox";
import MessagesThread from "@/components/MessagesThread";

export default function UserMessagesPage() {
  return (
    <Layout>
      <div className="grid gap-4 lg:grid-cols-2">
        <MessagesInbox />
        <MessagesThread />
      </div>
    </Layout>
  );
}
