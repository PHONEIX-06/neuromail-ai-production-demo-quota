param(
  [Parameter(Mandatory = $true)][string]$AwsAccountId,
  [string]$Region = "ap-south-1",
  [string]$Repository = "neuromail-api",
  [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"
$image = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com/$Repository`:$Tag"

aws ecr describe-repositories --repository-names $Repository --region $Region *> $null
if ($LASTEXITCODE -ne 0) {
  aws ecr create-repository --repository-name $Repository --region $Region
}

aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"
docker build -f apps/api/Dockerfile -t $Repository`:$Tag .
docker tag "$Repository`:$Tag" $image
docker push $image

Write-Host "Pushed $image"
