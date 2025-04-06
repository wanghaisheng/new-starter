/**
 * 邮件发送服务
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * 发送邮件
 * 在实际项目中，这里应该集成真实的邮件服务（如 SendGrid、AWS SES 等）
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log('开发环境：模拟发送邮件');
    console.log('收件人:', options.to);
    console.log('主题:', options.subject);
    console.log('内容:', options.text);
    return;
  }

  // 在实际项目中，这里应该调用真实的邮件服务
  // 例如：
  // await sendgrid.send({
  //   to: options.to,
  //   from: 'noreply@example.com',
  //   subject: options.subject,
  //   text: options.text,
  //   html: options.html
  // });
  
  throw new Error('邮件服务尚未配置');
} 