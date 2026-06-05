import { EtherealShadow } from "@/components/ui/etheral-shadow";

const EtherealShadowDemo = () => {
  return (
    <div className="flex w-full h-screen justify-center items-center">
      <EtherealShadow
      color="rgba(128, 128, 128, 1)"
        animation={{ scale: 100, speed: 90 }}
        noise={{ opacity: 1, scale: 1.2 }}
        sizing="fill"
        showTitle={true}
         />
    </div>
  );
};

export default EtherealShadowDemo;
