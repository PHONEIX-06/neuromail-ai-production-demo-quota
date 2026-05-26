param(
  [Parameter(Mandatory = $true)][string]$AwsAccountId,
  [string]$Region = "ap-south-1",
  [Parameter(Mandatory = $true)][string]$S3Bucket
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$out = Join-Path $root ".generated"
New-Item -ItemType Directory -Path $out -Force | Out-Null

foreach ($name in @("neuromail-api", "neuromail-worker")) {
  $template = Join-Path $root "task-definitions\$name.taskdef.json"
  $target = Join-Path $out "$name.taskdef.json"
  (Get-Content -Raw $template).
    Replace("<AWS_ACCOUNT_ID>", $AwsAccountId).
    Replace("<AWS_REGION>", $Region).
    Replace("<AWS_S3_BUCKET>", $S3Bucket) | Set-Content -Path $target -Encoding UTF8
  aws logs create-log-group --log-group-name "/ecs/$name" --region $Region 2>$null
  aws ecs register-task-definition --cli-input-json "file://$target" --region $Region
}

Write-Host "Registered ECS task definitions."
