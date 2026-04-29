async function test() {
    const url = "https://kekuwxhqrzvrgbjiqyue.supabase.co/rest/v1/classes?select=*";
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla3V3eGhxcnp2cmdiamlxeXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTkyMTAsImV4cCI6MjA5Mjk5NTIxMH0.U183t2yRk83igrSqpaNFZdMoXsw_X7yidWIzKm7nfBg";
    try {
        const res = await fetch(url, {
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`
            }
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Data:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}
test();
