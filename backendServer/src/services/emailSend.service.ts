import { Resend } from 'resend';

const resend = new Resend("re_PQzzM526_6x58Sv2NEVGxCEfHswuBio2B");


async function sendVerificationMail(email:string,otp:string) {
    await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'devwarsupport@gmail.com',
    subject: 'Hello World',
    html: '<p>Congrats on sending your <strong>first email</strong>!</p>'
});
}



export {sendVerificationMail};