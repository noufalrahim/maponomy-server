const csv = require("csv-parser");
const { Readable } = require("stream");

const buffer = Buffer.from(
  `name,address,phone_number,email,password,warehouse_id,latitude,longitude,type,store_image,active,salespersonid
Anno_SFPL,NAGOLE,9123456701,store001@example.com,Oms123Sneha!,185a7c59-c1ea-4f1a-9735-c39f04207760,17.436044,78.661495,own,,active,f88c001b-8dd6-438b-a21f-ebccb73d0da8`
);

const rows = [];

async function testParse() {
  await new Promise((resolve, reject) => {
    Readable.from(buffer)
      .pipe(
        csv({
          mapHeaders: ({ header }) => {
            const h = header.toLowerCase().trim();
            if (h === "lat" || h === "latitude" || h === "latitutde") return "latitude";
            if (h === "lng" || h === "long" || h === "longitude" || h === "longitutde")
              return "longitude";
            if (
              h === "phone" ||
              h === "phoneno" ||
              h === "phone_number" ||
              h === "phone number" ||
              h === "mobile"
            )
              return "phone_number";
            if (h === "email" || h === "email_address" || h === "email address")
              return "email";
            if (h === "name" || h === "customer_name" || h === "customer name" || h === "store name" || h === "store_name")
              return "name";
            if (h === "address" || h === "customer_address" || h === "customer address" || h === "location")
              return "address";
            if (h === "salesperson" || h === "salesperson_id" || h === "salespersonid")
              return "salespersonid";
            if (h === "warehouse" || h === "warehouse_id" || h === "warehouseid")
              return "warehouse_id";
            return h.replace(/\s+/g, "_");
          },
        })
      )
      .on("data", (row) => rows.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log("Parsed Rows:", JSON.stringify(rows, null, 2));

  for (const r of rows) {
    const parseCoord = (v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const s = String(v).trim();
      if (s === "") return undefined;
      const parsed = parseFloat(s.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? null : parsed;
    };

    const rawLat = parseCoord(r.latitude);
    const rawLong = parseCoord(r.longitude);

    console.log(`Row: ${r.name}`);
    console.log(`  rawLat: ${rawLat}`);
    console.log(`  rawLong: ${rawLong}`);
    console.log(`  r.latitude: ${r.latitude}`);
    console.log(`  r.longitude: ${r.longitude}`);
  }
}

testParse();
