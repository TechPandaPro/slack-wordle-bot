import dbus from "dbus-next";

(async () => {
  const interfaces = dbus
    .systemBus()
    .getProxyObject("org.asamk.Signal", "/org/asamk/Signal");
  (await interfaces)
    .getInterface("org.asamk.Signal")
    .then(() => console.log("done"));
})();
