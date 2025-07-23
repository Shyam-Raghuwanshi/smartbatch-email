import { Resend } from "resend";

const resend = new Resend("re_7KjUQfUS_6h6LsxK43kkUyswH9WfVEqD9");

const { data, error } = await resend.emails.send({
      from: "Acme <Alert@cryptoalert.doodl.co>",
      to: ["sr9993663832@gmail.com"],
      subject: "Pay attention to this email",
      html: "<strong>The crpyto hits the price. Hurry Up!</strong>",
});

console.log(data);
console.log(error);