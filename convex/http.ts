import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { resend } from "./emailService";
import { api } from "./_generated/api";

const http = httpRouter();

// Resend webhook endpoint
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    await ctx.runMutation(resend.lib.handleEmailEvent, {
      event: await req.json(),
    });
    return new Response("OK", { status: 200 });
  }),
});

// Unsubscribe endpoint
http.route({
  path: "/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Invalid unsubscribe link", { status: 400 });
    }

    try {
      // Find the email queue entry with this unsubscribe token
      const emailQueue = await ctx.runQuery(api.emailService.getEmailByUnsubscribeToken, {
        token,
      });

      if (!emailQueue) {
        return new Response("Invalid unsubscribe link", { status: 400 });
      }

      // Add to unsubscribes table
      await ctx.runMutation(api.emailService.unsubscribeEmail, {
        email: emailQueue.recipient,
        userId: emailQueue.userId,
        campaignId: emailQueue.campaignId,
        token,
        userAgent: req.headers.get("user-agent") || undefined,
      });

      // Return success page
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; }
            .success { color: green; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from our mailing list.</p>
            <p>You will no longer receive emails from us.</p>
          </div>
        </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
      });

    } catch (error) {
      console.error("Unsubscribe error:", error);
      return new Response("Error processing unsubscribe request", { status: 500 });
    }
  }),
});

// Email tracking pixel endpoint (for open tracking)
http.route({
  path: "/track/open/:emailId",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const emailId = req.url.split("/").pop();
    
    if (emailId) {
      try {
        await ctx.runMutation(api.emailService.trackEmailOpen, {
          emailQueueId: emailId as any,
          userAgent: req.headers.get("user-agent") || undefined,
          ipAddress: req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown",
        });
      } catch (error) {
        console.error("Error tracking email open:", error);
      }
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64"
    );

    return new Response(pixel, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  }),
});

// Click tracking endpoint
http.route({
  path: "/track/click/:emailId",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const emailId = url.pathname.split("/").pop();
    const targetUrl = url.searchParams.get("url");

    if (emailId && targetUrl) {
      try {
        await ctx.runMutation(api.emailService.trackEmailClick, {
          emailQueueId: emailId as any,
          clickedUrl: targetUrl,
          userAgent: req.headers.get("user-agent") || undefined,
          ipAddress: req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown",
        });
      } catch (error) {
        console.error("Error tracking email click:", error);
      }
    }

    // Redirect to target URL
    if (targetUrl) {
      return Response.redirect(targetUrl, 302);
    } else {
      return new Response("Invalid link", { status: 400 });
    }
  }),
});

export default http;
