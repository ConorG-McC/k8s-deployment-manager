data "aws_caller_identity" "current" {}

# data "aws_iam_policy_document" "assume_role" {
#   statement {
#     effect = "Allow"

#     principals {
#       type        = "Service"
#       identifiers = ["eks.amazonaws.com"]
#     }

#     actions = ["sts:AssumeRole"]
#   }
# }

# resource "aws_iam_role" "eks_poc_iam_role" {
#   name                 = "${local.cluster_name}_iam_role"
#   assume_role_policy   = data.aws_iam_policy_document.assume_role.json
#   permissions_boundary = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/DcpPermissionsBoundary"
# }

# resource "aws_iam_role_policy_attachment" "eks_cluster_AmazonEKSClusterPolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
#   role       = aws_iam_role.eks_poc_iam_role.name
# }

# resource "aws_iam_role_policy_attachment" "eks_cluster_AmazonEKSVPCResourceController" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
#   role       = aws_iam_role.eks_poc_iam_role.name
# }

# data "aws_iam_policy_document" "eks_worker_assume_role_policy" {
#   statement {
#     effect = "Allow"
#     principals {
#       type        = "Service"
#       identifiers = ["ec2.amazonaws.com"]
#     }
#     actions = ["sts:AssumeRole"]
#   }
# }

# resource "aws_iam_role" "eks_worker_role" {
#   name               = "${local.cluster_name}_worker_role"
#   assume_role_policy = data.aws_iam_policy_document.eks_worker_assume_role_policy.json
#   permissions_boundary = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/DcpPermissionsBoundary"
# }

# resource "aws_iam_role_policy_attachment" "eks_worker_AmazonEKSWorkerNodePolicy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
#   role       = aws_iam_role.eks_worker_role.name
# }

# resource "aws_iam_role_policy_attachment" "eks_worker_AmazonEC2ContainerRegistryReadOnly" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
#   role       = aws_iam_role.eks_worker_role.name
# }

# resource "aws_iam_role_policy_attachment" "eks_worker_AmazonEKS_CNI_Policy" {
#   policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
#   role       = aws_iam_role.eks_worker_role.name
# }



///////////////////////////////////////

resource "aws_iam_role" "masters_role" {
  name = "eks-${var.branch_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

// EKS and EKS Api permissions

resource "aws_iam_policy" "eks_console_readonly_policy" {
  name        = "EKSConsoleReadOnlyPolicy-${var.branch_name}"
  description = "Policy for read-only access to EKS Console"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "eks:ListFargateProfiles",
          "eks:DescribeNodegroup",
          "eks:ListNodegroups",
          "eks:ListUpdates",
          "eks:AccessKubernetesApi",
          "eks:ListAddons",
          "eks:TagResource",
          "eks:DescribeAddon",
          "eks:CreateAddon",
          "eks:UpdateAddon",
          "eks:DeleteAddon",
          "eks:DescribeCluster",
          "eks:DescribeAddonVersions",
          "eks:ListClusters",
          "eks:ListIdentityProviderConfigs",
          "eks:ListAddons",
          "eks:DescribeAddonConfiguration"
        ],
        Resource = [
          "${aws_eks_cluster.eks_cluster.arn}"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_eks_console_readonly" {
  role       = aws_iam_role.masters_role.name
  policy_arn = aws_iam_policy.eks_console_readonly_policy.arn
}

// IAM, Clouformation, EC2 and S3 permissions

resource "aws_iam_policy" "additional_readonly_policy" {
  name        = "AdditionalReadOnlyPolicy-${var.branch_name}"
  description = "Policy for IAM, CloudFormation, EC2, and S3 read-only access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "iam:ListRoles",
          "iam:CreatePolicyVersion",
          "iam:AttachRolePolicy",
          "iam:GetOpenIDConnectProvider",
          "iam:CreatePolicy",
          "iam:DeletePolicyVersion",
          "iam:CreateOpenIDConnectProvider",
          "iam:TagOpenIDConnectProvider",
          "iam:DetachRolePolicy",
          "iam:DeleteRole",
          "iam:UpdateAssumeRolePolicy",
          "iam:CreateRole",
          "iam:PassRole",
          "cloudformation:ListStacks",
          "cloudformation:CreateStack",
          "cloudformation:DeleteStack",
          "cloudformation:DescribeStacks",
          "ec2:CreateTags",
          "ec2:DeleteTags",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "ec2:CreateVolume",
          "ec2:DeleteVolume",
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:ModifyVolume",
          "s3:ListAllMyBuckets",
          "s3:ListBucket",
          "s3:ListBucketVersions",
          "s3:GetObject",
          "s3:PutObject",
          "s3:AbortMultipartUpload",
          "s3:ListBucketMultipartUploads",
          "s3:ListMultipartUploadParts",
          "s3:PutObjectTagging",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_additional_readonly_policy" {
  role       = aws_iam_role.masters_role.name
  policy_arn = aws_iam_policy.additional_readonly_policy.arn
}

// SSM Get Parameter Permissions

# resource "aws_iam_policy" "ssm_get_parameter_policy" {
#   name        = "SSMGetParameterPolicy"
#   description = "Policy to allow access to SSM GetParameter"

#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect   = "Allow",
#         Action   = ["ssm:GetParameter"],
#         // Is the below needed??
#         Resource = "${format("arn:aws:ssm:%s:%s:parameter/*", var.region, var.account_id)}"
#         # Resource = "*"
#       }
#     ]
#   })
# }

# resource "aws_iam_role_policy_attachment" "attach_ssm_policy" {
#   role       = aws_iam_role.masters_role.name
#   policy_arn = aws_iam_policy.ssm_get_parameter_policy.arn
# }
