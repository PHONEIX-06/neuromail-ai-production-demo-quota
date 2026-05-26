param(
  [string]$Region = "ap-south-1",
  [Parameter(Mandatory = $true)][string]$DatabaseUrl,
  [Parameter(Mandatory = $true)][string]$RedisUrl,
  [Parameter(Mandatory = $true)][string]$JwtSecret,
  [Parameter(Mandatory = $true)][string]$GeminiApiKey,
  [Parameter(Mandatory = $true)][string]$GoogleClientId,
  [Parameter(Mandatory = $true)][string]$GoogleClientSecret,
  [string]$GoogleRedirectUri,
  [string]$S3Bucket = "neuromail-ai-storage",
  [string]$UpstashRestUrl,
  [string]$UpstashRestToken
)

$ErrorActionPreference = "Stop"

function Upsert-Secret($Name, $Value) {
  aws secretsmanager describe-secret --secret-id $Name --region $Region *> $null
  if ($LASTEXITCODE -eq 0) {
    aws secretsmanager put-secret-value --secret-id $Name --secret-string $Value --region $Region | Out-Null
  } else {
    aws secretsmanager create-secret --name $Name --secret-string $Value --region $Region | Out-Null
  }
}

Upsert-Secret "/neuromail/DATABASE_URL" $DatabaseUrl
Upsert-Secret "/neuromail/REDIS_URL" $RedisUrl
Upsert-Secret "/neuromail/JWT_SECRET" $JwtSecret
Upsert-Secret "/neuromail/GEMINI_API_KEY" $GeminiApiKey
Upsert-Secret "/neuromail/GOOGLE_CLIENT_ID" $GoogleClientId
Upsert-Secret "/neuromail/GOOGLE_CLIENT_SECRET" $GoogleClientSecret
Upsert-Secret "/neuromail/AWS_S3_BUCKET" $S3Bucket

if ($GoogleRedirectUri) {
  Upsert-Secret "/neuromail/GOOGLE_REDIRECT_URI" $GoogleRedirectUri
}

if ($UpstashRestUrl) {
  Upsert-Secret "/neuromail/UPSTASH_REDIS_REST_URL" $UpstashRestUrl
}

if ($UpstashRestToken) {
  Upsert-Secret "/neuromail/UPSTASH_REDIS_REST_TOKEN" $UpstashRestToken
}

Write-Host "NeuroMail AWS secrets created/updated in $Region."
