import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const lambdaClient = new LambdaClient({
  region: process.env.REGION_AWS,
});

export async function invokePDFProcessor(jobId: string, campaignId: string): Promise<void> {
  try {
    const functionName = process.env.PDF_PROCESSOR_FUNCTION_NAME || "pdf-processor";

    const command = new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "Event", // Asynchronous invocation (fire and forget)
      Payload: JSON.stringify({
        jobId,
        campaignId,
      }),
    });

    const response = await lambdaClient.send(command);

    if (response.StatusCode !== 202) {
      throw new Error(
        `Lambda invocation failed with status ${response.StatusCode}`
      );
    }

    console.log(`Successfully invoked PDF processor for job ${jobId}`);
  } catch (error) {
    console.error("Failed to invoke PDF processor:", error);
    throw error;
  }
}
